import config as conf
import yagmail
from yagmail import inline
from datetime import date
from pprint import pprint as print
import os
import pandas as pd
try:
    import private_config as p_conf
except ModuleNotFoundError:
    print("No private_config found!")
    print("copy private_config_example.py to private_config.py and fill it out")
    print("DO NOT ADD YOUR PRIVATE_CONFIG TO VERSION CONTROL")
    exit()

def daily_mail(send=True):
    """
    Send mail about the days interesting sensors
    intended to be run daily
    """
    params                 = {}
    params["to"]           = p_conf.TO_LIST
    params["subject"]      = f"{date.today()} anomaly updates"
    params["contents"]     = list_anomalous_sensors()
    params["attachments"]  = [conf.CSV_OUTFILE]
    params["attachments"] += get_all_pngs_in_current_dir()
    if send:
        with yagmail.SMTP(p_conf.USERNAME, p_conf.PASSWORD) as sender:
            sender.send(**params)
    else:
        print(params)

def get_all_pngs_in_current_dir():
    return list(filter(lambda x: '.png' in x, os.listdir()))

def list_anomalous_sensors():
    sensors = pd.read_csv(conf.CSV_OUTFILE)
    sens_1_hour  = sensors[
        (sensors["test_residuals_1hour"] > conf.ONE_HOUR_THRESHOLD) &
        (sensors["name"].apply(lambda x: x not in conf.ONE_HOUR_IGNORE))]
    sens_1_day   = sensors[
        (sensors["test_residuals_1day"] > conf.ONE_DAY_THRESHOLD) &
        (sensors["name"].apply(lambda x: x not in conf.ONE_DAY_IGNORE))]
    sens_3_day   = sensors[
        (sensors["test_residuals_3days"] > conf.THREE_DAYS_THRESHOLD) &
        (sensors["name"].apply(lambda x: x not in conf.THREE_DAYS_IGNORE))]
    sens_min_val = sensors[
        (sensors["num_test_vals"] < conf.MIN_VALUES_PER_DAY) &
        (sensors["name"].apply(lambda x: x not in conf.MIN_VALUES_IGNORE))]
    def message_for_sensor(sensor):
        return "{} ({})".format(sensor["desc"], sensor["name"])
    return (["<b>Sensors flagged for an hour-long event</b>"] + 
            list(sens_1_hour.apply(message_for_sensor, axis=1)) + 
            ["<b>Sensors flagged for a day long event</b>"] + 
            list(sens_1_day.apply(message_for_sensor, axis=1)) + 
            ["<b>Sensors flagged for a 3 day long event</b>"] + 
            list(sens_3_day.apply(message_for_sensor, axis=1)) + 
            ["<b>Sensors flagged for having too few values</b>"] + 
            list(sens_min_val.apply(message_for_sensor, axis=1)))

##
if __name__ == "__main__":
    send_daily()
