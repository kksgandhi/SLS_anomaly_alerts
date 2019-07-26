import multiprocessing
from apscheduler.schedulers.background import BackgroundScheduler
from daily_controller import daily_everything
from os import path
import config as conf
import sys

worker_class = "tornado"
# recommended number of workers regardless of system
workers = multiprocessing.cpu_count() * 2 + 1
bind    = '0.0.0.0:8000'
timeout = 300


def on_starting(server):
    print("Starting Server")
    if not path.exists(conf.CSV_OUTFILE):
        print("Building cache. This will take a long time")
        sys.stdout.flush()
        daily_everything()
    print("Cache building complete")
    scheduler = BackgroundScheduler()
    scheduler.add_job(daily_everything, 'cron', hour='6')
    scheduler.start()
