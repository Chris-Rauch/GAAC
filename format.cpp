/* Description:
 *     This program is used to format a CSV file to make it compatible with the
 *     Robo Talker framework.
 *
 * Input:  1) Third Eye Late Payment Report 
 * 
 * Output: 1) RoboTalker_upload  <Insured,Phone,Group,Agent,Balance,Date,Contract>
 *         2) Follow Up
 * 
 * Notes:
 *     -Group is automatically set to the range of dates on the intent report
 *     -All files should be in CSV format
 * 
 */
#include <Spreadsheet_Reader/Row.h>

// column numbers
size_t INS;
size_t PHONE;
size_t AGENT;
size_t AGT_CODE;
size_t AMOUNT;
size_t IN_DATE;
size_t CAN_DATE;
size_t CONTRACT;
size_t GROUP;

// files
string IntentReport = "test.csv";
string NCA = "NoCallAgreement.txt";
string RoboCallerUpload = "newFile1.csv";
string FollowUp = "Follow_Up.csv";

const string Months[12] = {"January","February","March","April","May","June","July",
                           "August","September","October","November","December"};

// Fucntions
string trim(const string& str);
void removeDuplicateInsured(vector<Row>& list,vector<Row>& dupList);
bool checkNCAList(const vector<string>& ncaList, const string& agentName);
void writeToRoboTalker(ostream& outFile, vector<Row>& list, const string group);
void writeToFile(ostream& outFile, vector<Row>, vector<Row>, vector<Row>);
string getHeader(istream& cin);
string formatDate(const string date);
string formatContractNumber(const string num);
bool checkNoNumber(const string& phoneNumber){if(phoneNumber == "(000) 000-0000") return true;
                                              else return false;}

int main() {
    cout << "Select a file: ";
    cin >> IntentReport;
    cout << "Where do you want to save it? ";
    cin >> RoboCallerUpload;


    ifstream IntentReportFile(IntentReport), NCAFile(NCA);
    //ofstream outFile1(RoboCallerUpload),outFile2(FollowUp);
    vector<Row> ncaContracts, noNumContracts,readyContracts, followUpContracts;
    vector<string> ncaList;
    Row row;
    string str, group, dir;


    if(!IntentReportFile.is_open()) {
        cout << "IntentReportFile failed to open\n";
        return -1;
    }
    
    if(!NCAFile.is_open()) {
        cout << "NCA File failed to open\n";
        return -1;
    }

    //skip the two header lines
    group = getHeader(IntentReportFile);
/*
    dir = string("/home/chris/Documents/GAAC_RoboTalker") + group;
    try {    
        mkdir(dir);
    }
    catch(const std::exception& e) {
        std::cerr << e.what() << '\n';
    }
    
*/
    //populate No Call Agreement Vector  
    while(getline(NCAFile,str,'\n')) {
        ncaList.push_back(trim(str));
    }
    NCAFile.close();

    //populate all the contract vectors
    while(IntentReportFile >> row) {
        row.trim();
        if(checkNCAList(ncaList, row[AGENT])) 
            ncaContracts.push_back(row);

        else if(checkNoNumber(row[PHONE])) 
            noNumContracts.push_back(row);

        else 
            readyContracts.push_back(row); 
    }

    //move duplicate insured from <readyContracts> into <followUpContracts>
    removeDuplicateInsured(readyContracts,followUpContracts);

    ofstream outFile1(RoboCallerUpload),outFile2(FollowUp);

    //create file ready to be uploaded to RoboTalker website
    writeToRoboTalker(outFile1,readyContracts, group);

    //put everything else in another file
    writeToFile(outFile2,ncaContracts,noNumContracts,followUpContracts);

    IntentReportFile.close();
    outFile1.close();
    outFile2.close();
    IntentReportFile.close();

    return 1;
}

void writeToFile(ostream& outFile, vector<Row> nca, vector<Row> noNum, vector<Row> followUp){
    if(nca.size() != 0) {
        outFile << "No Call Agreements\n";
        for(size_t i = 0; i < nca.size(); ++i) 
            outFile << nca[i] << endl;
    }
    if(noNum.size() != 0) {
        outFile << "\nNo Numbers\n";
        for(size_t i = 0; i < noNum.size(); ++i) 
            outFile << noNum[i] << endl;
    }
    if(followUp.size() != 0) {
        outFile << "\nFollow Ups\n";
        for(size_t i = 0; i < followUp.size(); ++i) 
            outFile << followUp[i] << endl;
    }
}

/* Input: [outFile] - stream object of the file to be written to
 *        [list]    - list of contracts 
 *
 * Output: A file correctly formatted for the robo talker website
 * 
 * Format: <Insured,Phone,Group,Agent,Balance,Date,Contract #>
 */ 
void writeToRoboTalker(ostream& cout, vector<Row>& list, const string group) {
    cout << "Insured,Phone,Group,Agent,Balance,Date,Contract #\n";
    for(size_t i = 0; i < list.size(); ++i) {
        list[i].replaceAll("&"," and ");

        cout << list[i][INS] << ','
             << list[i][PHONE] << ','
             << group << ','
             << list[i][AGENT] << ','
             << list[i][AMOUNT] << ','
             << formatDate(list[i][CAN_DATE]) << ','
             << formatContractNumber(list[i][CONTRACT]) << endl;      
    }
}
string formatDate(const string date) {
    stringstream ss(date);
    string str, newDate;

    getline(ss,str,'/');
    newDate += Months[stoi(str)-1];

    getline(ss,str,'/');
    newDate += (" " + str + " ");

    getline(ss,str);
    newDate += str;

    return newDate;

}
string formatContractNumber(string num) {
    size_t found;
    string str;
    size_t begin, end;
    vector<string> contracts;
    
    do{
        found = num.find("and");

        if(found == string::npos) {
            contracts.push_back(num);
        }
        else {
            end = found;
            contracts.push_back(num.substr(0,found));
            num.erase(0,found+4);
        }
    } while(found != string::npos);

    for(size_t i = 0; i < contracts.size(); ++i) {
        for(size_t j = 0; j < contracts[i].size(); ++j) 
            str += (contracts[i][j]) + string(" ");
        if(i < contracts.size()-1)
            str += string("and ");   
    }
    
    return str;
}


/* Input: [list]    - a list of insureds
 *        [dupList] - a list of insured's with the same phone number
 * 
 * Output: Removes contracts with duplicate phone numbers from <list> and puts 
 *         them in <dupList>
 */
void removeDuplicateInsured(vector<Row>& list,vector<Row>& dupList) {
    bool foundDuplicates;

    //sort the list based on phone numbers
    sort(list.begin(), list.end(), [](const Row& lhs, const Row& rhs) {
        return lhs[PHONE] < rhs[PHONE];
    });

    //if phone numbers are the same, remove them from <list> 
    //and append it to <dupList>
    for(size_t i = 0; i < list.size() - 1; ++i) {
        for (size_t j = (i+1); j < list.size(); ++j) {
            if(list[i][PHONE] == list[j][PHONE] && list[i][INS] == list[j][INS]) {
                list[i].changeCell(CONTRACT,(list[i][CONTRACT] + string("and") + list[j][CONTRACT]) );
                list.erase(list.begin() + j);
                --j;
            }
            
            else if(list[i][PHONE] == list[j][PHONE]) {
                dupList.push_back(list[j]);
                list.erase(list.begin() + j);
                foundDuplicates = true;
                --j;
            }  
        }
        if(foundDuplicates) {
            dupList.push_back(list[i]);
            list.erase(list.begin() + i);
            foundDuplicates = false;
        }
    }
}

/* Input: [cin] - input file
 *
 * Output: Returns the date of the Intent Contracts Report. Skis first two lines
 */
string getHeader(istream& cin) {
    Row row;
    string str, dummy("Intent Contracts Report ");
    size_t found = dummy.size();

    cin >> row;
    row.replaceAll(" to ", "-");
    str = row[0];
    

    cin >> row;
    cout << row << endl;
    for(size_t i = 0; i < row.size(); ++i) {
        if(row[i] == "Agent Name")
            AGENT = i;
        else if(row[i] == "Agent Code")
            AGT_CODE = i;
        else if(row[i] == "Group Type")
            GROUP = i;
        else if(row[i] == "Contract #")
            CONTRACT = i;
        else if(row[i] == "Insured")
            INS = i;
        else if(row[i] == "Insured Tel. No.")
            PHONE = i;
        else if(row[i] == "Intent Date")
            IN_DATE = i;
        else if(row[i] == "Cancel Date")
            CAN_DATE = i;
        else if(row[i] == "Amount Due")
            AMOUNT = i;    
    }

    if(found != string::npos)
        return (str.substr(found,str.size()-1));
    else 
        return "group";
}

bool checkNCAList(const vector<string>& ncaList, const string& agentName) {
    for(size_t i = 0; i < ncaList.size(); ++i) {
        if(trim(ncaList[i]) == trim(agentName)) {
            return true;
        }
    }
    return false;
}

string trim(const string& str) {
    size_t first = str.find_first_not_of(' ');
    if (string::npos == first) {
        return str;
    }
    size_t last = str.find_last_not_of(' ');
    return str.substr(first, (last - first + 1));
}

