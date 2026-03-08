const sheetID = "1TBykyZx-eRMBDrRGBGGA8p_49iHlVDKN3wt9wijHJWM";
const apiKey = "AIzaSyB5VIy4kIySW7bVrjNYMpL5rkqZ7Oe758E";

const masterSheet = encodeURIComponent("Master Data 25 (New)");
const feesSheet = encodeURIComponent("Fees Collection");
const awSheet = encodeURIComponent("AW");

async function login() {
  const code = document.getElementById("loginCode").value.trim();
  if(code==""){
    alert("Enter Login Code");
    return;
  }

  document.getElementById("loginBtn").disabled = true;
  document.getElementById("loader").style.display = "block";

  try {
    // --- AW Sheet ---
    let resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${awSheet}?key=${apiKey}`);
    let data = await resp.json();
    let rows = data.values || [];

    let admission="", studentName="", father="", mother="", phone="", address="";

    for(let i=1;i<rows.length;i++){
      let r = rows[i];
      if(r[29] && r[29].toString().trim() == code){
        admission=r[1]||"";
        studentName=r[3]||"";
        father=r[6]||"";
        mother=r[5]||"";
        phone=r[22]||"";
        address=r[7]||"";
        break;
      }
    }

    if(admission==""){ alert("Invalid Login Code"); location.reload(); return; }

    // --- MASTER Sheet ---
    resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${masterSheet}?key=${apiKey}`);
    data = await resp.json();
    rows = data.values || [];

    let studentClass="", monthlyTuition=0, tuitionMonths=0, transportFees=0, transportMonths=0, prevRemain=0, discount=0;

    for(let i=1;i<rows.length;i++){
      let r = rows[i];
      if(r[1]==admission){
        studentClass=r[13]||"";
        monthlyTuition=parseFloat(r[4])||0;
        prevRemain=parseFloat(r[3])||0;
        discount=parseFloat(r[5])||0;
        tuitionMonths=parseFloat(r[6])||0;
        transportFees=parseFloat(r[7])||0;
        transportMonths=parseFloat(r[8])||0;
        break;
      }
    }

    // --- DISPLAY STUDENT ---
    document.getElementById("studentName").innerText = studentName;
    document.getElementById("welcomeName").innerText = "Welcome, " + studentName;
    document.getElementById("class").innerText = studentClass;
    document.getElementById("adm").innerText = admission;
    document.getElementById("father").innerText = father;
    document.getElementById("mother").innerText = mother;
    document.getElementById("phone").innerText = phone;
    document.getElementById("address").innerText = address;

    // --- FEES Sheet ---
    resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${feesSheet}?key=${apiKey}`);
    data = await resp.json();
    rows = data.values || [];

    let table="", cards="", totalPaid=0;

    for(let i=1;i<rows.length;i++){
      let r = rows[i];
      if(r[2]==admission){
        let date=r[1]||"", slip=r[0]||"", amount=parseFloat(r[5])||0;
        let feeType=(r[6]||"").toString(), session=(r[7]||"").toString();
        let tMonths=r[8]||"", trMonths=r[9]||"", exMonths=r[10]||"", mode=r[11]||"";

        if(session=="2025-26" && feeType.toLowerCase()=="monthly fees"){ totalPaid += amount; }

        table += `<tr>
<td>${date}</td><td>${slip}</td><td>₹${amount}</td><td>${feeType}</td>
<td>${session}</td><td>${tMonths}</td><td>${trMonths}</td><td>${exMonths}</td><td>${mode}</td>
</tr>`;

        cards += `<div class="fee-card">
<div><b>Date:</b> ${date}</div><div><b>Slip Number:</b> ${slip}</div>
<div><b>Amount Paid:</b> ₹${amount}</div><div><b>Fee Type:</b> ${feeType}</div>
<div><b>Session:</b> ${session}</div><div><b>Tuition Fee Months:</b> ${tMonths}</div>
<div><b>Transport Fee Months:</b> ${trMonths}</div>
<div><b>Exam Fee Months:</b> ${exMonths}</div>
<div><b>Payment Mode:</b> ${mode}</div></div>`;
      }
    }

    let examFee=1000;
    let totalFee=((monthlyTuition-discount)*tuitionMonths)+(transportFees*transportMonths)+examFee+prevRemain;
    let feeBalance=totalFee-totalPaid;

    // --- DISPLAY FEES ---
    document.getElementById("feeTable").innerHTML = table;
    document.getElementById("feeCards").innerHTML = cards;
    document.getElementById("monthlyTuition").innerText = "₹"+monthlyTuition;
    document.getElementById("tuitionMonths").innerText = tuitionMonths;
    document.getElementById("transportFees").innerText = "₹"+transportFees;
    document.getElementById("transportMonths").innerText = transportMonths;
    document.getElementById("prevRemain").innerText = "₹"+prevRemain;
    document.getElementById("discount").innerText = "₹"+discount;
    document.getElementById("totalPaid").innerText = "₹"+totalPaid;

    let bal=document.getElementById("feeBalance");
    bal.innerText = "₹"+feeBalance;
    bal.style.color = feeBalance>0 ? "red" : "green";

    // --- SHOW PORTAL ---
    document.getElementById("loginBox").style.display="none";
    document.getElementById("loader").style.display="none";
    document.getElementById("portal").style.display="block";

    // Populate calculator dropdowns
    populateFeeSelectors();

  } catch(e){
    console.error(e);
    alert("Error loading data. Check console.");
    document.getElementById("loader").style.display="none";
    document.getElementById("loginBtn").disabled=false;
  }
}

function logout(){ location.reload(); }

// ------------------ FEE CALCULATOR ------------------
function populateFeeSelectors() {
  const tuitionSelect = document.getElementById("calcTuitionMonths");
  const transportSelect = document.getElementById("calcTransportMonths");
  const examSelect = document.getElementById("calcExamMonths");

  tuitionSelect.innerHTML = "";
  transportSelect.innerHTML = "";
  examSelect.innerHTML = "";

  for (let i = 0; i <= 12; i++) tuitionSelect.innerHTML += `<option value="${i}">${i}</option>`;
  for (let i = 0; i <= 11; i++) transportSelect.innerHTML += `<option value="${i}">${i}</option>`;
  for (let i = 0; i <= 2; i++) examSelect.innerHTML += `<option value="${i}">${i}</option>`;

  // Automatic calculation on change
  tuitionSelect.addEventListener("change", calculateFees);
  transportSelect.addEventListener("change", calculateFees);
  examSelect.addEventListener("change", calculateFees);

  calculateFees();
}

function calculateFees() {
  const tuitionMonths = parseInt(document.getElementById("calcTuitionMonths").value);
  const transportMonths = parseInt(document.getElementById("calcTransportMonths").value);
  const examMonths = parseInt(document.getElementById("calcExamMonths").value);

  const monthlyTuition = parseFloat(document.getElementById("monthlyTuition").innerText.replace("₹","")) || 0;
  const transportFees = parseFloat(document.getElementById("transportFees").innerText.replace("₹","")) || 0;
  const discount = parseFloat(document.getElementById("discount").innerText.replace("₹","")) || 0;
  const examFeePerMonth = 500;

  const total = (tuitionMonths * (monthlyTuition - discount)) + (transportMonths * transportFees) + (examMonths * examFeePerMonth);

  const calcTotal = document.getElementById("calcTotal");
  calcTotal.innerText = "₹" + total;
  calcTotal.style.color = total>0 ? "red" : "green";

  // Pay Now button functionality
  const payNowBtn = document.getElementById("payNowBtn");
  payNowBtn.onclick = () => {
    if(total <= 0){
      alert("Please select months to calculate fees before paying.");
      return;
    }

    if(confirm(`You are about to pay ₹${total} to Pinnacle Global School. Continue?`)){
      const upiId = "pinnacleglobalschool.62697340@hdfcbank";
      const upiLink = `upi://pay?pa=${upiId}&pn=Pinnacle Global School&mc=&tid=&tr=&tn=School Fee Payment&am=${total}&cu=INR`;
      window.location.href = upiLink;
    }
  };
}
