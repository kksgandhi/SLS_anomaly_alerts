# Number before a sensor should be flagged as 'interesting'
# for the one hour test
ONE_HOUR_THRESHOLD   = 300
# for the one day test
ONE_DAY_THRESHOLD    = 300
# for the three days test
THREE_DAYS_THRESHOLD = 300
# for the min values test (are there enough readings in a day
MIN_VALUES_PER_DAY   = 200
# list of sensors to ignore (known interesting sensors)
# ex: ['gt-evnsense-030', 'gt-envsense-025']
ONE_HOUR_IGNORE      = []
ONE_DAY_IGNORE       = []
THREE_DAY_IGNORE     = []
MIN_VALUES_IGNORE    = []
# name of file where daily output should be stored
CSV_OUTFILE = './daily_output.csv'
