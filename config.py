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
ONE_HOUR_IGNORE   = []
ONE_DAY_IGNORE    = []
THREE_DAYS_IGNORE = []
MIN_VALUES_IGNORE = []
# name of file where daily output should be stored
CSV_OUTFILE = './daily_output.csv'
SENSOR_GROUPINGS = {
	"group1": [ "Hwy 21 at St Augustine Creek Level Sensor", "Houlihan Boat Ramp Sea Level Sensor", "Dean Forest Road at Harden Canal Sea Level Sensor", "Hwy 17 at Salt Creek Sea Level Sensor" ],
	"group2": [ "Fort Pulaski (A) Sea Level Sensor", "Fort Pulaski (B) Sea Level Sensor", "Catalina Drive Sea Level Sensor", "Lazaretto Creek Fishing Pier Sea Level Sensor", "Hwy 80 at Chimney Creek on Tybee Island Sea Level Sensor" ],
	"group3": ["Diamond Causeway at Shipyard Creek Sea Level Sensor", "Shipyard Road Sea Level Sensor", "Sullivan Street Sea Level Sensor", "Hunt Drive on Burnside Island Sea Level Sensor", "Faye Drive on Burnside Island Sea Level Sensor" ],
	"group4": [ "Coffee Bluff Marina environmental sensors", "Rose Dhu Island Sea Level Sensor", "Kilkenny Creek environmental sensors", "Sapelo Island Ferry Dock Sea Level Sensor" ],
	"group5": [ "Skidaway Road at Herb River Sea Level Sensor", "Savannah State Sea Level Sensor", "LaRoche Avenue at Nottingham Creek Sea Level Sensor", "Solomon Bridge Sea Level Sensor"],
	"group6": [ "Oatland Island Road environmental sensors", "Hwy 80 at Grays Creek Sea Level Sensor"],
	"group7": ["Landings Harbor Marina Sea Level Sensor","SKIO Dock Sea Level Sensor", "Turner Creek Boat Ramp Sea Level Sensor", "Walthour Road environmental sensors", "Bull River Marina environmental sensors" ]
}
# Number of days to train the model on.
# More days are better, but more affected by bad data. 
TRAIN_DELTA = 7
