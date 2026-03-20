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

        let admission="", studentName="";

        for (let i=1;i<rows.length;i++){
            let r=rows[i];
            if(r[29] && r[29].trim()==code){
                admission=r[1];
                studentName=r[3];
                break;
            }
        }

        if(!admission){ alert("Invalid Login Code"); return; }

        resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${masterSheet}?key=${apiKey}`);
        rows = (await resp.json()).values || [];

        for (let i=1;i<rows.length;i++){
            let r=rows[i];
            if(r[1]==admission){
                document.getElementById("class").innerText = r[14] || ""; // ✅ column O
                globalExamFee = parseFloat(r[9]) || 0;
                break;
            }
        }

        document.getElementById("studentName").innerText = studentName;
        document.getElementById("adm").innerText = admission;
        document.getElementById("welcomeName").innerText = "Welcome, " + studentName;

        document.getElementById("loginBox").style.display="none";
        document.getElementById("loader").style.display="none";
        document.getElementById("portal").style.display="block";

        populateSelectors();
        setupButtons();

    } catch(e){
        console.error(e);
        alert("Error loading data");
    }
}

function populateSelectors(){
    for(let i=0;i<=12;i++) calcTuitionMonths.innerHTML+=`<option value="${i}">${i}</option>`;
    for(let i=0;i<=11;i++) calcTransportMonths.innerHTML+=`<option value="${i}">${i}</option>`;
    for(let i=0;i<=2;i++) calcExamMonths.innerHTML+=`<option value="${i}">${i}</option>`;

    calcTuitionMonths.onchange = calculateFees;
    calcTransportMonths.onchange = calculateFees;
    calcExamMonths.onchange = calculateFees;
}

function calculateFees(){
    const t = +calcTuitionMonths.value;
    const tr = +calcTransportMonths.value;
    const ex = +calcExamMonths.value;

    const total = (t*1000) + (tr*500) + (ex*globalExamFee);

    document.getElementById("calcTotal").innerText = "₹"+total;

    document.getElementById("payNowBtn").onclick = () => pay(total);
}

function pay(amount){
    if(amount<=0){ alert("Select months first"); return; }

    const upi="pinnacleglobalschool.62697340@hdfcbank";
    const adm=document.getElementById("adm").innerText;
    const name=document.getElementById("studentName").innerText;
    const cls=document.getElementById("class").innerText;

    const note=`${adm} ${name} ${cls} FEE`;

    window.location.href=`upi://pay?pa=${upi}&pn=School&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
}

function setupButtons(){
    document.getElementById("payBalanceBtn").onclick = () => {
        let amt = document.getElementById("feeBalance").innerText.replace(/[^0-9]/g,"");
        pay(parseFloat(amt));
    };

    document.getElementById("sendScreenshotBalanceBtn").onclick =
    document.getElementById("sendScreenshotCalcBtn").onclick = () => {
        const adm=document.getElementById("adm").innerText;
        const name=document.getElementById("studentName").innerText;
        const cls=document.getElementById("class").innerText;

        const msg=`Hello, I have completed fee payment.\nAdmission No: ${adm}\nName: ${name}\nClass: ${cls}`;
        window.location.href=`https://wa.me/917830968000?text=${encodeURIComponent(msg)}`;
    };
}

function logout(){ location.reload(); }

document.getElementById("loginBtn").addEventListener("click", login);
