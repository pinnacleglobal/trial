const sheetID="1TBykyZx-eRMBDrRGBGGA8p_49iHlVDKN3wt9wijHJWM";
const apiKey="AIzaSyB5VIy4kIySW7bVrjNYMpL5rkqZ7Oe758E";

let admissionGlobal="";
let studentFirstName="";

async function login(){

const code=document.getElementById("loginCode").value.trim();
if(code==""){alert("Enter Login Code");return;}

document.getElementById("loader").style.display="block";

let resp=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/AW?key=${apiKey}`);
let data=await resp.json();
let rows=data.values;

for(let i=1;i<rows.length;i++){

let r=rows[i];

if(r[29]==code){

if(r[31]=="TRUE"){
alert("You Cannot Login As You Have Left The School. Please Contact The School.");
location.reload();
return;
}

admissionGlobal=r[1];
let studentName=r[3];

studentFirstName=studentName.split(" ")[0];

document.getElementById("studentName").innerText=studentName;
document.getElementById("adm").innerText=admissionGlobal;

break;
}

}

document.getElementById("portal").style.display="block";
document.getElementById("loginBox").style.display="none";
document.getElementById("loader").style.display="none";

populateFeeSelectors();
setupFeeBalancePayment();

}

function setupFeeBalancePayment(){

document.getElementById("payBalanceBtn").onclick=function(){

let amount=document.getElementById("feeBalance").innerText.replace(/[^0-9]/g,"");

let note=`${admissionGlobal} ${studentFirstName} FEE`;

let link=`upi://pay?pa=pinnacleglobalschool.62697340@hdfcbank&pn=Pinnacle Global School&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

window.location.href=link;

}

}

function calculateFees(){

let total=document.getElementById("calcTotal").innerText.replace(/[^0-9]/g,"");

let note=`${admissionGlobal} ${studentFirstName} FEE`;

let link=`upi://pay?pa=pinnacleglobalschool.62697340@hdfcbank&pn=Pinnacle Global School&am=${total}&cu=INR&tn=${encodeURIComponent(note)}`;

window.location.href=link;

}
