const sheetID = "1v0snUiDP5u60e2DGxQ6rx79MBdM_9IqubWWhNcDI0UA";
const apiKey = "AIzaSyB5VIy4kIySW7bVrjNYMpL5rkqZ7Oe758E";

const masterSheet = encodeURIComponent("Master Data 2026");
const feesSheet = encodeURIComponent("Fees Collection");
const awSheet = encodeURIComponent("AW");

let globalExamFee = 0;

async function login() {
    const code = document.getElementById("loginCode").value.trim();
    if (!code) { alert("Enter Login Code"); return; }

    document.getElementById("loginBtn").disabled = true;
    document.getElementById("loader").style.display = "block";

    try {
        let resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${awSheet}?key=${apiKey}`);
        let rows = (await resp.json()).values || [];

        let admission="", studentName="", father="", mother="", phone="", address="";

        for (let i=1;i<rows.length;i++){
            let r=rows[i];
            if (r[29] && r[29].trim()==code){
                admission=r[1]; studentName=r[3]; father=r[6];
                mother=r[5]; phone=r[22]; address=r[7];
                break;
            }
        }

        if(!admission){ alert("Invalid Login Code"); location.reload(); return; }

        resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${masterSheet}?key=${apiKey}`);
        rows = (await resp.json()).values || [];

        let monthlyTuition=0, tuitionMonths=0, transportFees=0, transportMonths=0, prevRemain=0, discount=0;

        for (let i=1;i<rows.length;i++){
            let r=rows[i];
            if (r[1]==admission){
                monthlyTuition=parseFloat(r[4])||0;
                prevRemain=parseFloat(r[3])||0;
                discount=parseFloat(r[5])||0;
                tuitionMonths=parseFloat(r[6])||0;
                transportFees=parseFloat(r[7])||0;
                transportMonths=parseFloat(r[8])||0;

                // ✅ EXAM FEE FROM COLUMN J
                globalExamFee=parseFloat(r[9])||0;
                break;
            }
        }

        document.getElementById("examFee").innerText="₹"+globalExamFee;

        populateFeeSelectors();

        document.getElementById("loginBox").style.display="none";
        document.getElementById("loader").style.display="none";
        document.getElementById("portal").style.display="block";

    } catch(e){
        console.error(e);
    }
}

function populateFeeSelectors(){
    const t=document.getElementById("calcTuitionMonths");
    const tr=document.getElementById("calcTransportMonths");
    const ex=document.getElementById("calcExamMonths");

    for(let i=0;i<=12;i++) t.innerHTML+=`<option>${i}</option>`;
    for(let i=0;i<=11;i++) tr.innerHTML+=`<option>${i}</option>`;
    for(let i=0;i<=2;i++) ex.innerHTML+=`<option>${i}</option>`;

    t.onchange=calculateFees;
    tr.onchange=calculateFees;
    ex.onchange=calculateFees;
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
}

function logout(){ location.reload(); }

document.addEventListener("DOMContentLoaded",()=>{
    document.getElementById("loginBtn").addEventListener("click",login);
});
