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
inputFile = "DetailedReport.csv"
gaac_uname = "###"
gaac_pword = "***"



# === FUCNTIONS ===

'''
Description: Memo's accounts in Third Eye

Input:  [driver]          - selenium webdriver object. Expected to already be on the 'Search Contracts' page
        [account_numbers] - array of account numbers. MWF prefix is optional {MWF99999,99999}              
        [memo_subject]    - The subject as a string
        [memo_body]       - The body as a string
        [insured_name]    - Optional. Used to do an additional check 

Output: Returns true if all the accounts were memo'd succsesfully. Otherwise,
        return false.    
'''
def memo_Accounts(driver,account_numbers,memo_subject,memo_body,insured_name = None):
    for x in account_numbers:
        #input contract number into search bar and search
        contractSearch = driver.find_element_by_name("VISIBLE_ContractNo")
        contractSearch.clear()
        contractSearch.send_keys(x)
        driver.find_element_by_name("quoteSearchContractByAll").click()

        #Do optional check and compare insured names
        if insured_name != None:
            compare_insured = driver.find_element_by_xpath("//*[@id='tab0']/div[1]/table/tbody/tr[2]/td[3]").text
            if compare_insured.strip() != insured_name.strip():
                return False

        #navigate to memo screen and write memo
        element=driver.find_element_by_xpath("//body")
        element.send_keys(Keys.ALT, 'M')
        driver.find_element_by_id("memoFunctions").click()
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
            print("No Such Element Exception...Unable to save memo")
            print('Contract Number:',x)
            return False
        else:
            pass
            #save_memo.click()
        finally:
            pass

        #set driver back to 'Search Page' and loop
        if(x != account_numbers[-1]):
            try:
                contract_page = driver.find_element_by_id("oCMenu2_top3a_0")
           except NoSuchElementException: 
                print("Could not locate Contract Search Page")
                return False
            else:
                contract_page.click() 
            finally: 
                pass
        else:
            return True
        

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

        if (
               (insured_name.replace(" and ", "&") in driver.find_element_by_xpath("//*[@id='tab0']/div[1]/table/tbody/tr[2]/td[3]").text) or 
               (insured_name.replace(" and", "&") in driver.find_element_by_xpath("//*[@id='tab0']/div[1]/table/tbody/tr[2]/td[3]").text) or
               (insured_name in driver.find_element_by_xpath("//*[@id='tab0']/div[1]/table/tbody/tr[2]/td[3]").text)
           ):

            #navigate to memo screen https://stackoverflow.com/questions/10140999/csv-with-comma-or-semicolon
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
            failed_accounts.append(x)
            return False


'''
Description: Determines the appropriate memo based on the description
'''
def memo_Message(description):
    if(description.upper() == "Answering Machine".upper()):
        return left_message_memo
    elif(description.upper() == "Connected".upper()):
        return connected_memo
    elif(description.upper() == "No Answer".upper()):
        return no_answer_memo
    elif(description.upper() == "Invalid Phone Number".upper()):
        return bad_number_memo
    else:
        print("The call description <",msg,"> does not match. Should be\n1)Answering Machine\n2)Connected\n3)No Answer\n4)Invalid Phone Number")
        return "Invalid Decsription"

'''
Description: Concatenates the subject into a single string
'''
def format_Subject(contact_name,dial_number,call_start_time,call_end_time,message_id,job_id):
    subject = ("DIAL NUMBER: [" + dial_number + '] ' +
              "CALL START TIME: [" + call_start_time + '] ' +
              "CALL END TIME: [" + call_end_time + '] ' +
              "MESSAGE ID: [" + message_id + '] ' +
              "JOB ID: [" + job_id + '] ')
    return subject

# === MAIN ===

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
username.send_keys(gaac_uname)
password.send_keys(gaac_pword)
driver.find_element_by_name("login").click()

#test for successful login
try:
    driver.find_element_by_xpath("//*[contains(.,'Admin Options')]")
except NoSuchElementException: 
    exit("Unsuccessful log in")

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
                contract_num = contract_num.replace(" ","")
                contract_num = contract_num.split("and")
            if(
                not memo_Accounts(driver,
                                  contract_num, #contract number
                                  memo_Message(row[3]), #body
                                  format_Subject(row[1],row[2],row[11],row[8],row[9],row[13]))
              ):
              failed_accounts.append(contract_num)

        #display progress
        if (line_count > 0):
            print(line_count,":",row[0].replace(" ", ""),"-",row[3])
        line_count += 1

print("Processed",(line_count-1),"Contracts")
print("--- %s seconds ---" % (time.time() - start_time))

#display accounts that didn't get memo'd
if failed_accounts:
    print("THE FOLLOWING ACCOUNTS WERE NOT MEMO'D:\n",failed_accounts)

driver.close()
