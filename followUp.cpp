/* Description:
 *   Inputs: 1) RoboTalker_upload
 *           2) RoboTalker_download
 *           3) Follow Up (might make this file hard coded)
 *           * All files should be in CSV format
 * 
 *   Moves contract numbers from the row file to the download file. This is 
 *   for the memo'ing. The python memo script is called.
 *   It also moves 'No Answer' and 'Bad Number' descriptions to the follow up 
 *   file.
 * 
 *   Output: 1) Modified RoboTalker_download file
 *           2) Modified Follow Up File
 *           3) Accounts will be memo'd
 */

#include <Spreadsheet_Reader/Row.h>


int main () {
    string file;
    Row row;
    vector<Row> vec1,vec2,vec3;
    size_t size;

    // open files
    //cout << "Enter RoboTalker_Upload File: ";
    //cin >> file;
    ifstream uploadFile("RoboCallerUpload.csv");
    if(!uploadFile.is_open()) {
        cout << "could not open row file\n";
        return -1;
    }
    //cout << "Enter RoboTalker_Download File: ";
    //cin >> file;
    fstream downloadFile("DetailedReport.csv");
    if(!downloadFile.is_open()) {
        cout << "couls not open download file\n";
        return -1;
    }
    //cout << "Enter Follow Up File: ";
    //cin >> file;
    fstream followUpFile("Follow_Up.csv");
    if(!followUpFile.is_open()) {
        cout << "could not open follow up file\n";
        return -1;
    }

    

    // store all the files in memory
    while(followUpFile >> row) {
        vec1.push_back(row);
    }
    while(uploadFile >> row) {
        vec2.push_back(row);
    }
    while(downloadFile >> row) {
        vec3.push_back(row);
    }

    //make sure the files line up
    if(vec2.size() != vec3.size()) {
        cout << "Files are different lengths\n";
        return -1;
    }
    else {
        size = vec3.size();
    }
    for(size_t i = 1; i < size; ++i) {
        if(vec2[i][0] != vec3[i][0]) {
            cout << "Insureds don't line up\n";
            return -1;
        }
    }

    // 1) Modify Robo Talker Download file

    // back to the beginning
    downloadFile.clear();
    downloadFile.seekg(0, std::ios::beg);

    // append contract numbers to the beginning of the line
    // write header
    if(size > 0) {
        downloadFile << vec2[0][6] << ',' << vec3[0] << endl;
    }
    // write rows
    for(size_t i = 1; i < size ; ++i) {
        downloadFile << vec2[i][6] << ',' << vec3[i] << endl;
    }
    // ===

    // 2) Modify Follow Up File
    size = vec1.size();
    for(size_t i = 0; i < size; ++i) {
        followUpFile << vec1[i] << endl;
    }
    followUpFile.clear();

    // add necessary rows to the follow up file
    size = vec3.size();
    bool firstFind = true;
    for(size_t i = 0; i < size; ++i) {
        if((vec3[i][2] == string("No Answer")) || (vec3[i][2] == string("Bad Number"))) {
            if(firstFind == true) {
                followUpFile << "\nBad Calls\n";
                followUpFile << vec2[0][6] << ',' << vec3[0] << endl; // header
                firstFind = false;
            }
            followUpFile << vec2[i][6] << ',' << vec3[i] << endl;
        }
    }
    // ===

    // 3) Memo Accounts
    // Call python script

    downloadFile.close();
    uploadFile.close();
    followUpFile.close();

    return 1;
}