import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from scipy import optimize
from scipy.optimize import curve_fit
import numpy as np
import csv
import pandas as pd
import dateutil.parser as date_parser
import datetime
from pprint import pprint as print
from scipy.interpolate import interp1d
import api_scraper as scraper
import config as conf
from pandas.plotting import register_matplotlib_converters
register_matplotlib_converters()

def get_sls_data(sensor, start_date, end_date):
    """
    Gets sls data for a sensor between start date and end date
    adjusts measurements for elevation
    """
    link      = sensor["link"]
    elevation = sensor["elev"]
    data      = scraper.get_obs_for_link(link, start_date, end_date)
    data      = pd.DataFrame(data, columns= ["value", "timestamp"])
    data["adj_value"] = data["value"].map(lambda value: float(elevation) + float(value))
    return data

def get_train(sensor, **kwargs):
    """
    Gets training data to later fit the ft. pulaski function
    This training data is a default of 7 days
    in the interest of not overlapping with the test data,
    it is 7 days offset by the largest test
    kwargs:
        date (str): date to get train data from (will be offset by testing periods)
            default: today
        train_delta (float): # of days of training data to get
            default: 7 days
        test_delta_array (list of floats): test deltas to use when choosing a training offset
            default: [1]
    """
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
    """
    Gets test data for a sensor
    two cases: if test_delta >= 1, simply gets that many days of data
    if test_delta < 1, returns a list of test for the last day
    e.g: if test_delta = 0.25, will return a list of 4 elements for each quarter of the day
    honestly I think it's bad coding practice too, but we did what we could
    kwargs:
        date(str): date to get test data from
            default: today
        test_delta(float): amount of test data to get
            default: 1 day
    """
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
        def get_individual_test(offset):
            delta = datetime.timedelta(days=(1-offset*test_delta))
            n_days_test  = datetime.timedelta(days=test_delta)
            start_date_test  = str(date - n_days_test - delta)
            end_date_test    = str(date - delta)
            test  = get_sls_data(sensor, start_date_test , end_date_test)
            return test
        tests = list(map(get_individual_test, range(int(1 / test_delta))))
        return tests, str(date)

def get_ftp(start_date, end_date):
    """
    Gets predictions from the ft pulaski sensor.
    This sensor acts like a baseline to compare other sensors to
    """
    data              = scraper.get_ft_pulaski(start_date, end_date)
    data              = pd.DataFrame(data)
    # no actual adjustments are done, but this line still remains
    data["adj_v"]     = data["v"]
    data["timestamp"] = data["t"].apply(date_parser.parse) 
    return data

def get_ftp_function(train_start, test_end):
    """
    creates the 'noaa ftp function' used in later curve fitting
    see the docstrings for that function for more info
    train_start: start of the training
    test_end: end of the testing
    """
    train_start = date_parser.parse(train_start)
    test_end = date_parser.parse(test_end)
    FTP_OFFSET = datetime.timedelta(days=7)
    ftp = get_ftp(str(train_start - FTP_OFFSET), str(test_end + FTP_OFFSET))
    
    xdata_noaa_range = ftp["timestamp"].apply(mdates.date2num)
    ydata_noaa_range = ftp["adj_v"]
    
    def ftp_function(x, xshift, yshift):
        """
        given some 'x' (a date converted to an int by date2num)
        returns the ft pulaski estimate at that x value
        xshift and yshift shift the input and output respectively, 
        but the programmer should not have to deal with them
        instead later curve fitting should estimate those parameters
        """
        f = interp1d(xdata_noaa_range, ydata_noaa_range, kind="cubic")
        inter_val = f(x + xshift)
        return ((inter_val) + yshift)

    return ftp_function

def fit_curve(sls_data, ftp_function, **kwargs):
    #curve_equation = kwargs.get("curve_equation", noaa_function)
    
    xdata = sls_data["timestamp"].apply(mdates.date2num)
    ydata = sls_data["adj_value"]    
    params, params_covariance = optimize.curve_fit(ftp_function, xdata, ydata)    
    return params

def calculate_residuals(data, params, ftp_function, **kwargs):
    verbose      = kwargs.get("verbose"     , False)
    scale_factor = kwargs.get("scale_factor", 1000)
    aggregator   = kwargs.get("aggregator"  , np.mean)
    test_data    = kwargs.get("test_delta"  , 1)
    if isinstance(data, list):
        kwargs["verbose"] = False
        return max(filter(lambda x: x is not None, map(lambda x: calculate_residuals(x, params, ftp_function, **kwargs), data)))
    try:
        xdata = data["timestamp"].apply(mdates.date2num)
        estimated_y = ftp_function(xdata, *params)

        if verbose:
            plot(data, params, ftp_function,xdata=xdata, estimated_y=estimated_y, **kwargs)

        squared_residuals = (estimated_y - data["adj_value"]) ** 2

        return aggregator(squared_residuals) * scale_factor
    except Exception as e:
        if verbose:
            raise e
        return None

def plot(data, params, ftp_function, **kwargs):
    xdata = kwargs.get("xdata", data["timestamp"].apply(mdates.date2num))
    estimated_y = kwargs.get("estimated_y", ftp_function(xdata, *params))
    verbose = kwargs.get("verbose", False)
    save_plots = kwargs.get("save_plots", False)
    plot_name = kwargs.get("plot_name", "")
    plt.figure(figsize=(30, 20))
    plt.grid(b=True)
    plt.xlabel('Time', fontsize=20, labelpad=10)
    plt.ylabel('Water Level (m)', fontsize=20)
    plt.scatter(data["timestamp"], data["adj_value"], color = "red", label='Sensor Data')
    plt.plot(data["timestamp"], estimated_y, label='Fort Pulaski (fitted, not original)', color="green", linewidth=1)
    plt.legend(loc='best', fontsize =16)
    if save_plots:
        plt.title(plot_name, fontdict={'fontsize':36})
        plt.savefig(plot_name + ".png", bbox_inches='tight')
    elif verbose:
        plt.show()
    plt.close()

#defaults to current day as the test day 
def full_sensor_test(sensor, **kwargs):
    
    test_all     = []
    test_res_all = []
    ends         = []
    num_pts_day  = 0
    test_delta_array = kwargs.get("test_delta_array", [1/24, 1, 3])
    save_plots = kwargs.get("save_plots", False)
    try:
        sensor_name = sensor["desc"]
        
        #get train
        train, start_date = get_train(sensor, **kwargs)
        #get test sets 
        for test_range in test_delta_array:
            test, end = get_test(sensor, test_delta=test_range, **kwargs)
            test_all.append(test)
            ends.append(end)
        
        num_pts_day = len(test_all[1])
        
        end_date = max(ends)
        ftp_function = get_ftp_function(start_date, end_date)
        
        params = fit_curve(train, ftp_function, **kwargs)
        train_residuals = calculate_residuals(train, params, ftp_function, **kwargs)    
        test_res_all = list(map(lambda curr_test: calculate_residuals(curr_test, params, ftp_function, **kwargs), test_all))
        if save_plots:
            sensor_id = sensor["name"]
            to_plot = False
            to_plot = to_plot or (test_res_all[0] > conf.ONE_HOUR_THRESHOLD
                                  and sensor_id not in conf.ONE_HOUR_IGNORE)
            to_plot = to_plot or (test_res_all[1] > conf.ONE_DAY_THRESHOLD
                                  and sensor_id not in conf.ONE_DAY_IGNORE)
            to_plot = to_plot or (test_res_all[2] > conf.THREE_DAYS_THRESHOLD
                                  and sensor_id not in conf.THREE_DAYS_IGNORE)
            num_pts_day = 0 if not num_pts_day else num_pts_day
            to_plot = to_plot or (num_pts_day < conf.MIN_VALUES_PER_DAY
                                  and sensor_id not in conf.MIN_VALUES_IGNORE)
            if to_plot:
                plot(test_all[2], params, ftp_function, plot_name=sensor_name,**kwargs)
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
    residuals = sensors.apply(full_sensor_test, axis=1, test_delta_array = [1/24, 1, 3], save_plots=True)
    sensors["train_residuals"]      = residuals.apply(lambda res: res[0]    if res else None)
    sensors["test_residuals_1hour"] = residuals.apply(lambda res: res[1][0] if res else None)
    sensors["test_residuals_1day"]  = residuals.apply(lambda res: res[1][1] if res else None)
    sensors["test_residuals_3days"] = residuals.apply(lambda res: res[1][2] if res else None)
    sensors["num_test_vals"]        = residuals.apply(lambda res: res[2]    if res else 0)
    sensors["flag_1hour"] = (
        (sensors["test_residuals_1hour"] > conf.ONE_HOUR_THRESHOLD) &
        (sensors["name"].apply(lambda x: x not in conf.ONE_HOUR_IGNORE)))
    sensors["flag_1day"] = (
        (sensors["test_residuals_1day"] > conf.ONE_DAY_THRESHOLD) &
        (sensors["name"].apply(lambda x: x not in conf.ONE_DAY_IGNORE)))
    sensors["flag_3days"] = (
        (sensors["test_residuals_3days"] > conf.THREE_DAYS_THRESHOLD) &
        (sensors["name"].apply(lambda x: x not in conf.THREE_DAYS_IGNORE)))
    sensors["flag_min_vals"] = (
        (sensors["num_test_vals"] < conf.MIN_VALUES_PER_DAY) &
        (sensors["name"].apply(lambda x: x not in conf.MIN_VALUES_IGNORE)))
    sensors = sensors.sort_values("num_test_vals", ascending=False)  
    sensors["run_date"] = datetime.datetime.utcnow()
    return sensors

if __name__ == "__main__":
    test_output = daily_test()
    test_output.to_csv('./test_output.csv')
    print(test_output)
