const sheetID = "1v0snUiDP5u60e2DGxQ6rx79MBdM_9IqubWWhNcDI0UA";
const apiKey = "AIzaSyB5VIy4kIySW7bVrjNYMpL5rkqZ7Oe758E";

const masterSheet = encodeURIComponent("Master Data 2026");
const feesSheet = encodeURIComponent("Fees Collection");
const awSheet = encodeURIComponent("AW");

let globalExamFee = 0;

async function login() {
    const code = document.getElementById("loginCode").value.trim();
    if (!code) { alert("Enter Login Code"); return; }
    document.getElementById("loader").style.display = "block";

    try {
        let resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${awSheet}?key=${apiKey}`);
        let rows = (await resp.json()).values || [];
        let admission="", studentName="", father="", mother="", phone="", address="";
        let loginBlocked=false;

        for (let i=1;i<rows.length;i++){
            let r=rows[i];
            if (r[29] && r[29].trim()==code){
                if (r[31] && r[31].toUpperCase()=="TRUE"){ loginBlocked=true; break; }
                admission=r[1]; studentName=r[3]; father=r[6]; mother=r[5]; phone=r[22]; address=r[7]; break;
            }
        }
        if(loginBlocked){ alert("You Cannot Login"); location.reload(); return; }
        if(!admission){ alert("Invalid Login Code"); location.reload(); return; }

        resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${masterSheet}?key=${apiKey}`);
        rows = (await resp.json()).values || [];
        let studentClass="", monthlyTuition=0, tuitionMonths=0;
        let transportFees=0, transportMonths=0, prevRemain=0, discount=0;

        for (let i=1;i<rows.length;i++){
            let r=rows[i];
            if (r[1]==admission){
                studentClass=r[14]||"";
                monthlyTuition=parseFloat(r[4])||0;
                prevRemain=parseFloat(r[3])||0;
                discount=parseFloat(r[5])||0;
                tuitionMonths=parseFloat(r[6])||0;
                transportFees=parseFloat(r[7])||0;
                transportMonths=parseFloat(r[8])||0;
                globalExamFee=parseFloat(r[9])||0;
                break;
            }
        }

        document.getElementById("studentName").innerText=studentName;
        document.getElementById("welcomeName").innerText="Welcome, "+studentName;
        document.getElementById("class").innerText=studentClass;
        document.getElementById("adm").innerText=admission;
        document.getElementById("father").innerText=father;
        document.getElementById("mother").innerText=mother;
        document.getElementById("phone").innerText=phone;
        document.getElementById("address").innerText=address;

        document.getElementById("monthlyTuition").innerText="₹"+monthlyTuition;
        document.getElementById("tuitionMonths").innerText=tuitionMonths;
        document.getElementById("transportFees").innerText="₹"+transportFees;
        document.getElementById("transportMonths").innerText=transportMonths;
        document.getElementById("prevRemain").innerText="₹"+prevRemain;
        document.getElementById("discount").innerText="₹"+discount;
        document.getElementById("examFee").innerText="₹"+globalExamFee;

        resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${feesSheet}?key=${apiKey}`);
        rows = (await resp.json()).values || [];

        let table="", cards="", totalPaid=0;
        for (let i=1;i<rows.length;i++){
            let r=rows[i];
            if (r[2]==admission){
                let amount=parseFloat(r[5])||0;
                totalPaid+=amount;
                table+=`<tr>
<td>${r[1]}</td><td>${r[0]}</td><td>₹${amount}</td>
<td>${r[6]}</td><td>${r[7]}</td>
<td>${r[8]}</td><td>${r[9]}</td>
<td>${r[10]}</td><td>${r[11]}</td>
</tr>`;
                cards+=`<div class="fee-card">
<div><b>Date:</b> ${r[1]}</div>
<div><b>Slip:</b> ${r[0]}</div>
<div><b>Amount:</b> ₹${amount}</div>
</div>`;
            }
        }

        let totalFee=((monthlyTuition-discount)*tuitionMonths)+(transportFees*transportMonths)+globalExamFee+prevRemain;
        let feeBalance=totalFee-totalPaid;

        document.getElementById("feeTable").innerHTML=table;
        document.getElementById("feeCards").innerHTML=cards;
        document.getElementById("totalPaid").innerText="₹"+totalPaid;

        let bal=document.getElementById("feeBalance");
        bal.innerText="₹"+feeBalance;
        bal.style.color=feeBalance>0?"red":"green";

        document.getElementById("loginBox").style.display="none";
        document.getElementById("loader").style.display="none";
        document.getElementById("portal").style.display="block";

        populateFeeSelectors();
        setupButtons();

    } catch(e){ console.error(e); alert("Error loading data"); }
}

function populateFeeSelectors(){
    const t=document.getElementById("calcTuitionMonths");
    const tr=document.getElementById("calcTransportMonths");
    const ex=document.getElementById("calcExamMonths");
    t.innerHTML=""; tr.innerHTML=""; ex.innerHTML="";
    for(let i=0;i<=12;i++) t.innerHTML+=`<option value="${i}">${i}</option>`;
    for(let i=0;i<=11;i++) tr.innerHTML+=`<option value="${i}">${i}</option>`;
    for(let i=0;i<=2;i++) ex.innerHTML+=`<option value="${i}">${i}</option>`;
    t.onchange=calculateFees; tr.onchange=calculateFees; ex.onchange=calculateFees;
}

function calculateFees(){
    const t=parseInt(document.getElementById("calcTuitionMonths").value);
    const tr=parseInt(document.getElementById("calcTransportMonths").value);
    const ex=parseInt(document.getElementById("calcExamMonths").value);
    const monthly=parseFloat(document.getElementById("monthlyTuition").innerText.replace("₹",""))||0;
    const transport=parseFloat(document.getElementById("transportFees").innerText.replace("₹",""))||0;
    const discount=parseFloat(document.getElementById("discount").innerText.replace("₹",""))||0;
    let total=(t*(monthly-discount))+(tr*transport)+(ex*globalExamFee);
    document.getElementById("calcTotal").innerText="₹"+total;
    document.getElementById("payNowBtn").onclick=()=>payUPI(total);
}

function payUPI(amount){
    if(amount<=0){ alert("Select months"); return; }
    const upi="pinnacleglobalschool.62697340@hdfcbank";
    const adm=document.getElementById("adm").innerText;
    const name=document.getElementById("studentName").innerText;
    const cls=document.getElementById("class").innerText;
    const note=`${adm} ${name} ${cls} FEE`;
    const link=`upi://pay?pa=${upi}&pn=Pinnacle Global School&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    window.location.href=link;
}

function setupButtons(){
    document.getElementById("payBalanceBtn").onclick=()=>{
        let amount=parseFloat(document.getElementById("feeBalance").innerText.replace(/[^0-9]/g,""));
        payUPI(amount);
    };
    const sendBtns=[document.getElementById("sendScreenshotBalanceBtn"),document.getElementById("sendScreenshotCalcBtn")];
    sendBtns.forEach(btn=>{
        btn.onclick=()=>{
            const adm=document.getElementById("adm").innerText;
            const name=document.getElementById("studentName").innerText;
            const cls=document.getElementById("class").innerText;
            const msg=`Hello, I have completed fee payment.\nAdmission: ${adm}\nName: ${name}\nClass: ${cls}`;
            window.location.href=`https://wa.me/917830968000?text=${encodeURIComponent(msg)}`;
        };
    });
}

function logout(){ location.reload(); }

document.addEventListener("DOMContentLoaded",()=>{
    document.getElementById("loginBtn").addEventListener("click",login);
});
