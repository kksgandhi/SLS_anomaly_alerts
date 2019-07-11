try:
    import private_config as p_conf
except ModuleNotFoundError:
    print("No private_config found!")
    print("Fill out private_config_example.py and copy it to private_config.py")
    print("DO NOT ADD YOUR PRIVATE_CONFIG TO VERSION CONTROL")
import config as conf
import yagmail

def send_daily():
    sender = yagmail.SMTP(p_conf.USERNAME,
                          p_conf.PASSWORD)
    sender.send()

if __name__ == "__main__":
    send_daily()
