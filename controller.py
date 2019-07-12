import analysis
import emailer
import config as conf

def daily_everything():
    daily_data = analysis.daily_test()
    daily_data.to_csv(conf.CSV_OUTFILE)
    emailer.daily_mail()

if __name__ == "__main__":
    daily_everything()
