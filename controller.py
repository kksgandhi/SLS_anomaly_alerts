import analysis
import emailer
import config as conf
import os

def daily_everything():
    list(map(os.remove, emailer.get_all_pngs_in_current_dir()))
    daily_data = analysis.daily_test()
    daily_data.to_csv(conf.CSV_OUTFILE)
    emailer.daily_mail()

if __name__ == "__main__":
    daily_everything()
