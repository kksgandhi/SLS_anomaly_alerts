"""
Controller code that runs the daily analysis
and sends an email based on that analysis
Little code should be in this file, it should
just link the other files
"""
import analysis
import emailer
import config as conf
import os

def daily_everything():
    """
    Runs daily analysis and sends daily email
    clears all pictures from the previous day
    """
    # clear all pictures from the previous day
    list(map(os.remove, emailer.get_all_pngs_in_current_dir()))
    # run daily analysis and put it in a csv
    daily_data = analysis.daily_test()
    daily_data.to_csv(conf.CSV_OUTFILE)
    # send daily email
    emailer.daily_mail()

if __name__ == "__main__":
    daily_everything()
