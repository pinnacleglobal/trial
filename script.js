const sheetID="1v0snUiDP5u60e2DGxQ6rx79MBdM_9IqubWWhNcDI0UA";
const apiKey="AIzaSyB5VIy4kIySW7bVrjNYMpL5rkqZ7Oe758E";

let globalExamFee=0;

async function login(){
const code=document.getElementById("loginCode").value.trim();
if(!code){alert("Enter Login Code");return;}

document.getElementById("loader").style.display="block";

let resp=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/AW?key=${apiKey}`);
let rows=(await resp.json()).values||[];

let admission="",name="";
for(let r of rows){
if(r[29]==code){admission=r[1];name=r[3];break;}
}

if(!admission){alert("Invalid");return;}

resp=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/Master%20Data%202026?key=${apiKey}`);
rows=(await resp.json()).values||[];

for(let r of rows){
if(r[1]==admission){
document.getElementById("class").innerText=r[14]||"";
globalExamFee=parseFloat(r[9])||0;
}
}

document.getElementById("studentName").innerText=name;
document.getElementById("adm").innerText=admission;

document.getElementById("loginBox").style.display="none";
document.getElementById("portal").style.display="block";

populate();
}

function populate(){
for(let i=0;i<=12;i++) calcTuitionMonths.innerHTML+=`<option>${i}</option>`;
for(let i=0;i<=11;i++) calcTransportMonths.innerHTML+=`<option>${i}</option>`;
for(let i=0;i<=2;i++) calcExamMonths.innerHTML+=`<option>${i}</option>`;
}

function calculate(){
let t=+calcTuitionMonths.value;
let tr=+calcTransportMonths.value;
let ex=+calcExamMonths.value;

let total=(t*1000)+(tr*500)+(ex*globalExamFee);

calcTotal.innerText="₹"+total;

if(total>0) totalBox.classList.add("active");
else totalBox.classList.remove("active");

payNowBtn.onclick=()=>pay(total);
}

function pay(amount){
window.location.href=`upi://pay?pa=test@upi&am=${amount}`;
}

calcTuitionMonths.onchange=calculate;
calcTransportMonths.onchange=calculate;
calcExamMonths.onchange=calculate;

resetBtn.onclick=()=>{
calcTuitionMonths.value=0;
calcTransportMonths.value=0;
calcExamMonths.value=0;
calculate();
};

function logout(){location.reload();}

loginBtn.onclick=login;
