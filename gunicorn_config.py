import multiprocessing

worker_class = "gevent"
# recommended number of workers regardless of system
workers = multiprocessing.cpu_count() * 2 + 1

timeout = 300
