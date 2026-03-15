const sheetID="1TBykyZx-eRMBDrRGBGGA8p_49iHlVDKN3wt9wijHJWM";
const apiKey="AIzaSyB5VIy4kIySW7bVrjNYMpL5rkqZ7Oe758E";

const masterSheet="Master Data 25 (New)";
const feesSheet="Fees Collection";
const awSheet="AW";

let admissionGlobal="";
let firstNameGlobal="";
let classGlobal="";

async function login(){

const code=document.getElementById("loginCode").value.trim();

if(code==""){alert("Enter Login Code");return;}

let resp=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${awSheet}?key=${apiKey}`);

let data=await resp.json();

let rows=data.values;

let studentName="",father="",mother="",phone="",address="";

for(let i=1;i<rows.length;i++){

let r=rows[i];

if(r[29] && r[29].toString().trim()==code){

if(r[31] && r[31].toString().toUpperCase()=="TRUE"){

alert("You Cannot Login As You Have Left The School. Please Contact School.");

return;

}

admissionGlobal=r[1]||"";

studentName=r[3]||"";

father=r[6]||"";

mother=r[5]||"";

phone=r[22]||"";

address=r[7]||"";

break;

}

}

if(admissionGlobal==""){alert("Invalid Login Code");return;}

firstNameGlobal=studentName.split(" ")[0];

document.getElementById("studentName").innerText=studentName;
document.getElementById("adm").innerText=admissionGlobal;
document.getElementById("father").innerText=father;
document.getElementById("mother").innerText=mother;
document.getElementById("phone").innerText=phone;
document.getElementById("address").innerText=address;


resp=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${masterSheet}?key=${apiKey}`);

data=await resp.json();

rows=data.values;

let studentClass="";

for(let i=1;i<rows.length;i++){

let r=rows[i];

if(r[1]==admissionGlobal){

studentClass=r[13]||"";

break;

}

}

classGlobal=studentClass;

document.getElementById("class").innerText=studentClass;

document.getElementById("portal").style.display="block";
document.getElementById("loginBox").style.display="none";

populateFeeSelectors();

setupFeeBalancePayment();

}

function upiPay(amount){

let note=`${admissionGlobal} ${firstNameGlobal} Class-${classGlobal} FEE`;

let link=`upi://pay?pa=pinnacleglobalschool.62697340@hdfcbank&pn=Pinnacle Global School&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

window.location.href=link;

showWhatsAppButton();

}

function setupFeeBalancePayment(){

document.getElementById("payBalanceBtn").onclick=function(){

let text=document.getElementById("feeBalance").innerText.replace(/[^0-9]/g,"");

let amount=parseFloat(text);

if(amount<=0){alert("No balance to pay.");return;}

upiPay(amount);

}

}

function populateFeeSelectors(){

const t=document.getElementById("calcTuitionMonths");
const tr=document.getElementById("calcTransportMonths");
const ex=document.getElementById("calcExamMonths");

for(let i=0;i<=12;i++) t.innerHTML+=`<option>${i}</option>`;
for(let i=0;i<=12;i++) tr.innerHTML+=`<option>${i}</option>`;
for(let i=0;i<=2;i++) ex.innerHTML+=`<option>${i}</option>`;

t.onchange=calculateFees;
tr.onchange=calculateFees;
ex.onchange=calculateFees;

}

function calculateFees(){

let t=parseInt(document.getElementById("calcTuitionMonths").value);
let tr=parseInt(document.getElementById("calcTransportMonths").value);
let ex=parseInt(document.getElementById("calcExamMonths").value);

let monthly=2000;
let transport=500;
let examFee=500;

let total=(t*monthly)+(tr*transport)+(ex*examFee);

let balance=parseFloat(document.getElementById("feeBalance").innerText.replace(/[^0-9]/g,""))||0;

if(total>balance){

alert("Selected amount is greater than fee balance.");

return;

}

document.getElementById("calcTotal").innerText="₹"+total;

document.getElementById("payNowBtn").onclick=function(){

if(total<=0){alert("Select months first.");return;}

upiPay(total);

}

}

function showWhatsAppButton(){

let msg=`Payment Done
Admission: ${admissionGlobal}
Student: ${firstNameGlobal}
Class: ${classGlobal}
Please find attached payment screenshot.`;

let url="https://wa.me/917830968000?text="+encodeURIComponent(msg);

let btn=document.getElementById("whatsappBtn");

btn.style.display="block";

btn.onclick=function(){

window.open(url,"_blank");

}

}

document.getElementById("loginBtn").onclick=login;
