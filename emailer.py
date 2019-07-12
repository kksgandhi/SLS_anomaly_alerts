try:
    import private_config as p_conf
except ModuleNotFoundError:
    print("No private_config found!")
    print("Fill out private_config_example.py and copy it to private_config.py")
    print("DO NOT ADD YOUR PRIVATE_CONFIG TO VERSION CONTROL")
    exit()
import config as conf
import yagmail
from yagmail import inline
from datetime import date
import os

def daily_mail():
    """
    Send mail about the days interesting sensors
    intended to be run daily
    """
    with yagmail.SMTP(p_conf.USERNAME, p_conf.PASSWORD) as sender:
        params                 = {}
        params["to"]           = p_conf.TO_LIST
        params["subject"]      = f"{date.today()} anomaly updates"
        params["contents"]     = ["Attached are interesting sensors"]
        params["attachments"]  = [conf.CSV_OUTFILE]
        params["attachments"] += get_all_pngs_in_current_dir()
        sender.send(**params)

def get_all_pngs_in_current_dir():
    return list(filter(lambda x: '.png' in x, os.listdir()))

if __name__ == "__main__":
    send_daily()
