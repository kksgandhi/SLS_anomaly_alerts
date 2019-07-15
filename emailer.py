import config as conf
import yagmail
from yagmail import inline
from datetime import date
from pprint import pprint as print
import os
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
    params["contents"]     = ["Attached are interesting sensors"]
    params["attachments"]  = [conf.CSV_OUTFILE]
    params["attachments"] += get_all_pngs_in_current_dir()
    if send:
        with yagmail.SMTP(p_conf.USERNAME, p_conf.PASSWORD) as sender:
            sender.send(**params)
    else:
        print(params)

def get_all_pngs_in_current_dir():
    return list(filter(lambda x: '.png' in x, os.listdir()))

if __name__ == "__main__":
    send_daily()
