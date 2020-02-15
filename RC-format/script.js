/* TODO:
 * No Call Agreement
 * Auto Fill the Group Tab
 * Compare NCA list before 'and' replacement
 * Check duplicate numbers
 */

console.log("Hello there!");

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
  } else {
    alert('The File APIs are not fully supported in this browser.');
  }

//Event Listeners
document.getElementById('files').addEventListener('change', handleFileSelect, false);
document.getElementById('submit').addEventListener('click', submitForm);

//Data
var ContractArray = []; //stores data of all contracts from the uploaded file
let Months = ["January","February","March","April","May","June","July",
              "August","September","October","November","December"];
var noCallAgreementArr = ["Anthony Napoli Insurance Agency Inc.", 
                          "BEACH CITIES INSURANCE SERVICES",
                          "CAROLYN GALBRAITH AGENT",
                          "ELK GROVE INSURANCE SERVICES INC",
                          "ERIK HANSEN INSURANCE",
                          "Fixated Financial and Insurance Solutions Inc.",
                          "JAMES DUNNE INSURANCE AGENCY",
                          "ROBINSON & FOGLE INSURANCE AGENCY"];

// Functions

// === handleFileSelect ===
// Description: Event handler. Triggered when a file is selected. Displays basic data of file
function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0; i < files.length; i++) {
        output.push('<li><strong>', escape(files[i].name), '</strong> (', files[i].type || 'n/a', ') - ',
                  files[i].size, ' bytes, last modified: ',
                  files[i].lastModifiedDate ? files[i].lastModifiedDate.toLocaleDateString() : 'n/a',
                  '</li>');
    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
  }

// === submitForm ===
// Description: Event handler. Triggered when the submit button is clicked. Main driver for reading
//              and processing data from the file
function submitForm(evt) {
    //reads the first file
    var file = document.getElementById('files').files[0];

    if(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
console.log("is this working")
            //change data from a single string to an array of Contract objects
            prepareData(e.target.result);

            //Make three sub-arrays of Contract Array
            var files = sortFiles(); // files = (noNum, NCA, ready)

            //format the file so it is ready to upload to RoboCaller website
            formatData(files[2]);

            //convert data into a string
            var str0 = arrToString(files[0],"Intent Contracts With No Number");
            var str1 = arrToString(files[1],"Intent Contracts with a No Call Agreement");
            var str2 = arrToFormattedString(files[2],"Insured,Phone,Group,Agent,Balance,Date,Contract #");
            
            //viewArray(ContractArray);
            
            //write to file and download 
            
            download(str0,"No-Number.csv",'text/csv;charset=utf-8;');
            download(str1,"No-Call-Agreement.csv",'text/csv;charset=utf-8;');
            download(str2,"Robo-Caller.csv",'text/csv;charset=utf-8;');
            
        };
        reader.readAsText(file);

    } else {
        alert("invalid file");
    }
}

// Changes data from a string to an array
// Input: [data] - contains all the data from the original upload as a string
//
// Output: [ContractArray] - Populates the ContractArray with contract objects based on the input (global variable)
//     
// WARNING: Input file CANNOT contain commas. They are used to distinguish cells of data
function prepareData(data) {
    var fileArr, lineArr;

    //remove commas
    data = removeCommas(data);
    //data = replaceAll(data,'&',' and ');

    fileArr = data.split('\n');//this causes the last line to be empty
       
    //ignore the first two lines of the report (start at i = 2)
    for(var i = 2; i < fileArr.length-1; ++i) {
        lineArr = fileArr[i].split(',');
        var Contract = {AgentName:lineArr[0],
                        AgentCode:lineArr[1],
                        GroupType:lineArr[2],
                        ContractNumber:lineArr[3],
                        Insured:lineArr[4],
                        PhoneNumber:lineArr[5],
                        IntentDate:lineArr[6],
                        CancelDate:lineArr[7],
                        AmountDue:lineArr[8],
                        NoCallAgreement:false};
        ContractArray.push(Contract);
    }
    //set NoCallAgreement to true if necessary
    checkNoCallAgreement();
    data = replaceAll(data,'&',' and ');
}

// === sortFiles ===
// Input: [ContractArray] - Contains all the contracts from the original file (global variable) 
//
// Output: [returnArr] - a vector of the 3 sorted arrays <arr1, arr2, arr3>
//
// Sort Criteria: 1)No Number   2)No Call Agreement   3)Neither of these
function sortFiles() {
    var noNumArr = [], ncaArr = [], readyArr = [], returnArr = []; 

    for(var i = 0; i < ContractArray.length; i++) {
        if(ContractArray[i].NoCallAgreement == true) {
            ncaArr.push(ContractArray[i]);
        } else if (ContractArray[i].PhoneNumber == "(000) 000-0000") {
            noNumArr.push(ContractArray[i]);
        } else {
            readyArr.push(ContractArray[i]);
        }
    }
    returnArr.push(noNumArr,ncaArr,readyArr);
    return returnArr;
}

// === checkNoCallAgreement ===
// Input: [ContractArray] - Contains all the contracts from the original file (global variable)
//
// Output: If the Agent is on the No Call Agreement List, switches flag to true
function checkNoCallAgreement() {
    for(var i = 0; i < ContractArray.length; i++) {
        for(var j = 0; j < noCallAgreementArr.length; j++) {
            agtName = ContractArray[i].AgentName.toLowerCase()
            if(agtName.trim() == noCallAgreementArr[j].toLowerCase()) {
                ContractArray[i].NoCallAgreement = true;
                j = noCallAgreementArr.length; //exit early
            }
        }
    }
}

// === formatData ===
// Input: [arr] - An array of Contract objects (pass by reference)
//
// Output: Changes the date of each contract from numbers (01/01/2020)
//         to words (January 1 2020)
//         Puts spaces in the contract number (M W F 1 0 1 0 1 0)
//         Appends contract numbers with duplicate insured
//         Sorts by Name of Insured A-Z, alphanumeric
function formatData(arr) {
    for(var i = 0; i < arr.length; ++i) {
        //numbers to words
        var date = arr[i].IntentDate.split('/');
        var month = Months[parseInt(date[0],10)], day = date[1], year = date[2];
        arr[i].IntentDate = month + ' ' + day + ' ' + year;

        //spaces in the contract numbers
        var contractNum = "";
        for(var j = 0; j < arr[i].ContractNumber.length; ++j){
            contractNum += (arr[i].ContractNumber[j] + ' ');
        }
        arr[i].ContractNumber = contractNum;
    }

    checkDuplicateInsured(arr);
    //
    // Output: returns a concatenated string in csv AND robo caller format
    //
// Format: <Agent Name,Agent Code,Group Type,Contract #,Insured,Insured Tel. No.,Intent Date,Cancel Date,Amount Due>
function arrToString(arr, header) {
    var str = header + '\n';
    for(var i = 0; i < arr.length; ++i) {
        str += arr[i].AgentName + ',' + arr[i].AgentCode + ',' + arr[i].GroupType + ',' + arr[i].ContractNumber + ',' + 
        arr[i].Insured + ',' + arr[i].PhoneNumber + ',' + arr[i].IntentDate + ',' + arr[i].CancelDate + ',' +
        arr[i].AmountDue + ',' + arr[i].NoCallAgreement + '\n';
    }
    return str;
}

// === arrToFormattedString ===
// Input: [arr] - An array of Contract objects
//
// Output: returns a concatenated string in csv AND robo caller format
//
// Format: <Insured,Phone,Group,Agent,Balance,Date,Contract #>
function arrToFormattedString(arr,header) {
    var str = header + '\n';
    for(var i = 0; i < arr.length; ++i) {
        str += (arr[i].Insured + ',' + arr[i].PhoneNumber + ',' + "" + ',' + arr[i].AgentName + ',' + 
        arr[i].AmountDue + ',' + arr[i].IntentDate + ',' + arr[i].ContractNumber + '\n');
    }
    return str;
}

// === download ===
// Input: [dataStr]  - The data to be written to a file. Should be in csv format
//        [filename] - The name of the file
//        [type]     - The type of file
//
// Output: Writes dataStr to a file
function download(dataStr,filename,type) {   
    //write data to a file
    var file = new Blob([dataStr], {type: type});

    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a");
        var url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }  
}

// === checkDuplicateInsured ===
// Input: [arr] - An array of contracts
//
// Output: Appends contracts with same number, same agent and similar insured names
//         Using .33 as the minimum similarity required. That's the lowest contract i've found so far      
function checkDuplicateInsured(arr) {
    sim_ratio = .33;
    for(var i = 0; i < arr.length - 1; ++i) {
        for(var j = i+1; j < arr.length; ++j) {
            if( (arr[i].PhoneNumber == arr[j].PhoneNumber) && (similarity(arr[i].AgentName,arr[j].AgentName) > sim_ratio)  
                    && (similarity(arr[i].Insured,arr[j].Insured) > sim_ratio) ) {
                arr[i].ContractNumber += ("and " + arr[j].ContractNumber);
                arr.splice(j,1);
                console.log("Matchinng phone numbers merged on lines", (i+2), "and",(j+1));
            }
            else if(arr[i].PhoneNumber == arr[j].PhoneNumber) {
                //flag these and put them in another file to be followed up manually
                console.log(arr[i].ContractNumber,"and",arr[j].ContractNumber);  
            }
        }
    }
}

// === similarity ===
// Description: Compares two strings and returns a likeness % based on Levenshtein distance (edit distance)
function similarity(s1, s2) {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}
// === editDistance ===
// Description: Helper function to calculate Levenshtein distance (edit distance)
function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
  
    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
        var lastValue = i;
        for (var j = 0; j <= s2.length; j++) {
            if (i == 0) 
                costs[j] = j;
            else {
                if (j > 0) {
                    var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0)
            costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

// === compareFunction ===
// Description: Used to sort contract array by insured name. Alphanumeric 1-Z
function compareFunction(a,b) {
    const A = a.Insured.toUpperCase();
    const B = b.Insured.toUpperCase();

    if(A > B) return 1;
    if(A < B) return -1;
    return 0;
}

// === removeCommas ===
// Input: [str] - the data from the original csv file
//
// Output: Returns a string without any unnecessary commas
function removeCommas(str) {
    var str1 = str;
    var flip = false;

    for(var i = 0; i <str1.length; ++i ) {
        if(str1[i] == '"') {
            flip = !(flip);
            str1 = str1.slice(0,i) + str1.slice(i+1); // remove quotes
        }
        if( (flip == true) && (str1[i] == ',') ) {
            str1 = str1.slice(0,i) + str1.slice(i+1); // remove commas
        }
    }
    return str1;
} 

// === replaceAll ===
// Input: [str] - data from csv file
//        [c]   - the character to be replaced
//        [nc]  - the replacement character
//
// Output: Returns a string that replaces all instances of c in str, with nc
function replaceAll(str,c,nc) {
    var str1, str2 = str;

    while(str1 != str2) {
        str1 = str2;
        str2 = str1.replace(c,nc);
    }
    return str2;
}

// === remove ===
// Input: [str] - data from csv file
//        [c]   - character that is removed
//
// Ouptut: Returns a string after removing all characters 'c'
function remove(str,c) {
    for(var i = 0; i < str.length; ++i) {
        if(str[i] == c) {
            str = str.slice(0,i) + str.slice(i+1);
        }
    }
    return str;
}

// === viewArray ===
function viewArray(arr) {
    for(var i = 0; i < arr.length; ++i){
        console.log(arr[i].AgentName, ',', arr[i].AgentCode, ',', arr[i].GroupType, ',', arr[i].ContractNumber, ',', 
                    arr[i].Insured, ',', arr[i].PhoneNumber, ',', arr[i].IntentDate, ',', arr[i].CancelDate, ',',
                    arr[i].AmountDue, ',', arr[i].NoCallAgreement);
    }
}