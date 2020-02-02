from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import NoSuchElementException
import time
import os
import csv

start_time = time.time()

left_message_memo = "L/P CALL ROBO L/M ON A/M"
connected_memo = "L/P CALL ROBO CONNECTED"
no_answer_memo = "L/P CALL ATTEMPTED NO ANSWER BY INSURED"
bad_number_memo = "L/P CALL ATTEMPTED BAD NUMBER"
website = "https://gaac.thirdeyesys.ca/insight/"
inputFile = "DetsailedReport2.csv"

#Returns truw if the memo was successfully saved
def memo_Account(driver,account_number,insured_name,memo_subject,memo_body):

    account_numbers = account_number.split("and")
    success = False

    for x in account_numbers:    
        #search contract number
        contractSearch = driver.find_element_by_name("VISIBLE_ContractNo")
        contractSearch.clear()
        contractSearch.send_keys(x)
        driver.find_element_by_name("quoteSearchContractByAll").click()

        if insured_name.upper() in driver.find_element_by_xpath("//*[@id="tab0"]/div[1]/table/tbody/tr[2]/td[3]").text.upper():

            #navigate to memo screen
            element=driver.find_element_by_xpath("//body")
            element.send_keys(Keys.ALT, 'M')
            driver.find_element_by_id("memoFunctions").click()

            #write memo
            memoSubject = driver.find_element_by_id("memoSubject")
            memoBody = driver.find_element_by_id("memoBody")
            memoSubject.clear()
            memoBody.clear()
            memoSubject.send_keys(memo_subject)
            memoBody.send_keys(memo_body)

            #save memo
            try:
                save_memo = driver.find_element_by_xpath('//*[@title="Save Memo"]')  
            except NoSuchElementException: 
                '''
                try to get back to the correct screen
                return false
                ''' 
                exit("No Such Element Exception...Unable to save memo")
            else:
                #pass
                save_memo.click()
            finally:
                pass

            #driver.save_screenshot('screen.png')

            #move to contracts page & memo account
            if(x != account_numbers[-1]):
                try:
                    contract_page = driver.find_element_by_id("oCMenu2_top3a_0")
                except NoSuchElementException: 
                    exit("Could not locate Contract Search Page")
                else:
                    contract_page.click() 
                finally: 
                    pass
            else:
                return True
        else:
            return False



def memo_Message(msg):
    if(msg.upper() == "Answering Machine".upper()):
        return left_message_memo
    elif(msg.upper() == "Connected".upper()):
        return connected_memo
    elif(msg.upper() == "No Answer".upper()):
        return no_answer_memo
    elif(msg.upper() == "Invalid Phone Number".upper()):
        return bad_number_memo
    else:
        quit("The call description <",msg,"> does not match. Should be\n1)Answering Machine\n2)Connected\n3)No Answer\n4)Invalid Phone Number")
        return "Error"

def format_Subject(contact_name,dial_number,call_start_time,call_end_time,message_id,job_id):
    subject = ("Insured: " + contact_name + '\n' +
              "Dial Number: " + dial_number + '\n' +
              "Call Start Time: " + call_start_time + '\n' +
              "Call End Time: " + call_end_time + '\n' +
              "Message ID: " + message_id + '\n' +
              "Job ID: " + job_id)
    return subject

#create driver object
chrome_options = webdriver.ChromeOptions()
chrome_options.add_argument('--headless')
chrome_driver_path = os.getcwd() + "/chromedriver/chromedriver" #path to chrome driver
driver = webdriver.Chrome(executable_path=chrome_driver_path,chrome_options=chrome_options)

#login to GAAC website
driver.get(website)
username = driver.find_element_by_name("LoginId")
password = driver.find_element_by_name("LoginPassword")
username.clear()
password.clear()
username.send_keys("Chris")
password.send_keys("Matt1907")
driver.find_element_by_name("login").click()

#test for successful login
try:
    driver.find_element_by_xpath("//*[contains(.,'Admin Options')]")
except NoSuchElementException: 
    exit("Unsuccessful log in")

#test for correct file format

#parse file
with open(inputFile,mode = 'r',encoding = 'utf-8') as csv_file:
    #file operations
    csv_reader = csv.reader(csv_file,delimiter=',')
    line_count = 0

    for row in csv_reader:
        #skip the header line, No Answers & Bad Numbers
        if (line_count == 0):
            pass

        #move to contracts page & memo account
        else:
            try:
                contract_page = driver.find_element_by_id("oCMenu2_top3a_0")
            except NoSuchElementException: 
                exit("Could not locate Contract Search Page")
            else:
                contract_page.click()
            finally: 
                pass
            memo_Account(driver,row[0].replace(" ", ""),row[1],memo_Message(row[3]),format_Subject(row[1],row[2],row[11],row[8],row[9],row[13]))
        
        line_count += 1

        #display progress
        if (line_count > 0):
            print(line_count,":",row[0].replace(" ", ""),"-",row[3])

    print("Processed",(line_count-1),"Contracts")

print("--- %s seconds ---" % (time.time() - start_time))
driver.close()
