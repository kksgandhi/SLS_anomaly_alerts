import multiprocessing
from apscheduler.schedulers.background import BackgroundScheduler
from daily_controller import daily_everything
from os import path
import config as conf

worker_class = "tornado"
# recommended number of workers regardless of system
workers = multiprocessing.cpu_count() * 2 + 1

timeout = 300


def on_starting(server):
    if not path.exists(conf.CSV_OUTFILE):
        daily_everything()
    scheduler = BackgroundScheduler()
    scheduler.add_job(daily_everything, 'cron', hour='6')
    scheduler.start()
