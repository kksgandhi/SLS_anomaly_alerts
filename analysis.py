import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from scipy import optimize
from scipy.optimize import curve_fit
import numpy as np
from scipy import optimize
import csv
import pandas as pd
import dateutil.parser as date_parser
import datetime
from pprint import pprint as print
from scipy.interpolate import interp1d
import api_scraper as scraper

def get_sls_data(sensor, start_date, end_date):
    link      = sensor["link"]
    elevation = sensor["elev"]
    #print(link)
    #print(start_date)
    #print(end_date)
    data      = scraper.get_obs_for_link(link, start_date, end_date)
    #print(data)
    data      = pd.DataFrame(data, columns= ["value", "timestamp"])
    #data      = data.sort_values(by = ['timestamp'])
    data["adj_value"] = data["value"].map(lambda value: float(elevation) + float(value))
    return data

def get_train(sensor, **kwargs):
    date = (date_parser.parse(kwargs["date"])
            if "date" in kwargs
            else datetime.datetime.utcnow())
    train_delta  = kwargs.get("train_delta", 7) 
    n_days_train = datetime.timedelta(days=train_delta)
    
    max_test_offset = datetime.timedelta(days=max(kwargs.get("test_delta_array", [1])))
    start_date_train = str(date - (n_days_train +  max_test_offset))
    end_date_train   = str(date - max_test_offset)   
    train = get_sls_data(sensor, start_date_train, end_date_train)
    return train, start_date_train

def get_test(sensor, **kwargs):
    date = (date_parser.parse(kwargs["date"])
            if "date" in kwargs
            else datetime.datetime.utcnow())

    test_delta   = kwargs.get("test_delta" , 1)
    if test_delta >= 1:
        n_days_test  = datetime.timedelta(days=test_delta)

        start_date_test  = str(date - n_days_test)
        end_date_test    = str(date)
        test  = get_sls_data(sensor, start_date_test , end_date_test)
        return test, end_date_test
    else:
        def aaa(x):
            delta = datetime.timedelta(days=(1-x*test_delta))
            n_days_test  = datetime.timedelta(days=test_delta)
            start_date_test  = str(date - n_days_test - delta)
            end_date_test    = str(date - delta)
            test  = get_sls_data(sensor, start_date_test , end_date_test)
            return test
        tests = list(map(aaa, range(int(1 / test_delta))))
        return tests, str(date)

def clean_noaa(start_date, end_date):
    YSHIFT_GUESS = 0.5
    data              = scraper.get_ft_pulaski(start_date, end_date)
    data              = pd.DataFrame(data)
    data["adj_v"]     = data["v"].apply(lambda x: float(x) - YSHIFT_GUESS)
    data["timestamp"] = data["t"].apply(date_parser.parse) 
    return data

def get_ftp_function(train_start, test_end):
    train_start = date_parser.parse(train_start)
    test_end = date_parser.parse(test_end)
    noaa_offset = datetime.timedelta(days=7)
    ftp = clean_noaa(str(train_start - noaa_offset), str(test_end + noaa_offset))
    
    xdata_noaa_range = ftp["timestamp"].apply(mdates.date2num)
    ydata_noaa_range = ftp["adj_v"]
    
    def noaa_function(x, xshift, yshift):
        f = interp1d(xdata_noaa_range, ydata_noaa_range, kind="cubic")
        inter_val = f(x + xshift)
        return ((inter_val) + yshift)

    return noaa_function

def fit_curve(sls_data, ftp_function, **kwargs):
    #curve_equation = kwargs.get("curve_equation", noaa_function)
    
    xdata = sls_data["timestamp"].apply(mdates.date2num)
    ydata = sls_data["adj_value"]    
    params, params_covariance = optimize.curve_fit(ftp_function, xdata, ydata)    
    return params

def calculate_residuals(data, params, ftp_function, **kwargs):
    #curve_equation = kwargs.get("curve_equation", noaa_function)
    verbose        = kwargs.get("verbose"       , False)
    scale_factor   = kwargs.get("scale_factor"  , 1000)
    aggregator     = kwargs.get("aggregator"    , np.mean)
    test_data      = kwargs.get("test_delta"    , 1)
    if type(data) == 'list':
        return max(map(lambda x: calculate_residuals(x, params, ftp_function, **kwargs), data))
    try:
        xdata = data["timestamp"].apply(mdates.date2num)
        estimated_y = ftp_function(xdata, *params)

        if verbose:
            plt.figure(figsize=(30, 20))
            plt.grid(b=True)
            plt.xlabel('Time', fontsize=20, labelpad=10)
            plt.ylabel('Water Level (m)', fontsize=20)
            plt.scatter(xdata, data["adj_value"], color = "red", label='Data')
            plt.plot(xdata, estimated_y, label='Fitted function', color="green", linewidth=6)
            plt.legend(loc='best', fontsize =16)

        squared_residuals = (estimated_y - data["adj_value"]) ** 2

        return aggregator(squared_residuals) * scale_factor
    except:
        return None

#defaults to current day as the test day 
def full_sensor_test(sensor, **kwargs):
    
    test_all     = []
    test_res_all = []
    ends         = []
    num_pts_day  = 0
    try:
        sensor_name = sensor["desc"]
        
        #get train
        train, start_date = get_train(sensor, **kwargs)
        #get test sets 
        for test_range in kwargs["test_delta_array"]:
            test, end = get_test(sensor, test_delta=test_range, **kwargs)
            test_all.append(test)
            ends.append(end)
        
        num_pts_day = len(test_all[1])
        
        end_date = max(ends)
        ftp_function = get_ftp_function(start_date, end_date)
        
        params = fit_curve(train, ftp_function, **kwargs)
        train_residuals = calculate_residuals(train, params, ftp_function, **kwargs)    
        test_res_all = list(map(lambda curr_test: calculate_residuals(curr_test, params, ftp_function, **kwargs), test_all))
        print("Success: " + sensor_name)
        return train_residuals, test_res_all, num_pts_day
    except Exception as e:
        if kwargs.get("verbose"):
            raise e
        print("ERROR  : " + sensor["desc"] + " | " + str(e))
        return None

def daily_test():    
    api_data  = scraper.get_sensors_with_obs_type()
    sensors   = pd.DataFrame(api_data)
    residuals = sensors.apply(full_sensor_test, axis=1, test_delta_array = [1/24, 1, 3])
    sensors["train_residuals"]      = residuals.apply(lambda res: res[0]    if res else None)
    sensors["test_residuals_1hour"] = residuals.apply(lambda res: res[1][0] if res else None)
    sensors["test_residuals_1day"]  = residuals.apply(lambda res: res[1][1] if res else None)
    sensors["test_residuals_3days"] = residuals.apply(lambda res: res[1][2] if res else None)
    sensors["num_test_vals"]        = residuals.apply(lambda res: res[2]    if res else None)
    sensors = sensors.sort_values("num_test_vals", ascending=False)  
    return sensors

if __name__ == "__main__":
    test_output = daily_test()
    test_output.to_csv('./test_output.csv')
    print(test_output)
