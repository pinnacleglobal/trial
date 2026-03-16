const sheetID = "1TBykyZx-eRMBDrRGBGGA8p_49iHlVDKN3wt9wijHJWM";
const apiKey = "AIzaSyB5VIy4kIySW7bVrjNYMpL5rkqZ7Oe758E";

const masterSheet = encodeURIComponent("Master Data 25 (New)");
const feesSheet = encodeURIComponent("Fees Collection");
const awSheet = encodeURIComponent("AW");

async function login() {
    const code = document.getElementById("loginCode").value.trim();

    if (code == "") {
        alert("Enter Login Code");
        return;
    }

    document.getElementById("loginBtn").disabled = true;
    document.getElementById("loader").style.display = "block";

    try {
        // Fetch AW sheet
        let resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${awSheet}?key=${apiKey}`);
        let data = await resp.json();
        let rows = data.values || [];

        let admission = "", studentName = "", father = "", mother = "", phone = "", address = "";
        let loginBlocked = false;

        for (let i = 1; i < rows.length; i++) {
            let r = rows[i];
            if (r[29] && r[29].toString().trim() == code) {
                if (r[31] && r[31].toString().toUpperCase() == "TRUE") {
                    loginBlocked = true;
                    break;
                }
                admission = r[1] || "";
                studentName = r[3] || "";
                father = r[6] || "";
                mother = r[5] || "";
                phone = r[22] || "";
                address = r[7] || "";
                break;
            }
        }

        if (loginBlocked) {
            alert("You Cannot Login As You Have Left The School. Please Contact The School.");
            location.reload();
            return;
        }

        if (admission == "") {
            alert("Invalid Login Code");
            location.reload();
            return;
        }

        // Fetch Master Data
        resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${masterSheet}?key=${apiKey}`);
        data = await resp.json();
        rows = data.values || [];

        let studentClass = "", monthlyTuition = 0, tuitionMonths = 0, transportFees = 0, transportMonths = 0, prevRemain = 0, discount = 0;

        for (let i = 1; i < rows.length; i++) {
            let r = rows[i];
            if (r[1] == admission) {
                studentClass = r[13] || "";
                monthlyTuition = parseFloat(r[4]) || 0;
                prevRemain = parseFloat(r[3]) || 0;
                discount = parseFloat(r[5]) || 0;
                tuitionMonths = parseFloat(r[6]) || 0;
                transportFees = parseFloat(r[7]) || 0;
                transportMonths = parseFloat(r[8]) || 0;
                break;
            }
        }

        // Populate student info
        document.getElementById("studentName").innerText = studentName;
        document.getElementById("welcomeName").innerText = "Welcome, " + studentName;
        document.getElementById("class").innerText = studentClass;
        document.getElementById("adm").innerText = admission;
        document.getElementById("father").innerText = father;
        document.getElementById("mother").innerText = mother;
        document.getElementById("phone").innerText = phone;
        document.getElementById("address").innerText = address;

        // Fetch Fees Collection
        resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${feesSheet}?key=${apiKey}`);
        data = await resp.json();
        rows = data.values || [];

        let table = "", cards = "", totalPaid = 0;
        let examFee = 1000;

        for (let i = 1; i < rows.length; i++) {
            let r = rows[i];
            if (r[2] == admission) {
                let date = r[1] || "";
                let slip = r[0] || "";
                let amount = parseFloat(r[5]) || 0;
                let feeType = r[6] || "";
                let session = r[7] || "";
                let tMonths = r[8] || "";
                let trMonths = r[9] || "";
                let exMonths = r[10] || "";
                let mode = r[11] || "";

                if (session == "2025-26" && feeType.toLowerCase() == "monthly fees") {
                    totalPaid += amount;
                }

                table += `<tr>
                    <td>${date}</td>
                    <td>${slip}</td>
                    <td>₹${amount}</td>
                    <td>${feeType}</td>
                    <td>${session}</td>
                    <td>${tMonths}</td>
                    <td>${trMonths}</td>
                    <td>${exMonths}</td>
                    <td>${mode}</td>
                </tr>`;

                cards += `<div class="fee-card">
                    <div><b>Date:</b> ${date}</div>
                    <div><b>Slip Number:</b> ${slip}</div>
                    <div><b>Amount Paid:</b> ₹${amount}</div>
                    <div><b>Fee Type:</b> ${feeType}</div>
                    <div><b>Session:</b> ${session}</div>
                    <div><b>Tuition Fee Months:</b> ${tMonths}</div>
                    <div><b>Transport Fee Months:</b> ${trMonths}</div>
                    <div><b>Exam Fee Months:</b> ${exMonths}</div>
                    <div><b>Payment Mode:</b> ${mode}</div>
                </div>`;
            }
        }

        let totalFee = ((monthlyTuition - discount) * tuitionMonths) + (transportFees * transportMonths) + examFee + prevRemain;
        let feeBalance = totalFee - totalPaid;

        document.getElementById("feeTable").innerHTML = table;
        document.getElementById("feeCards").innerHTML = cards;

        document.getElementById("monthlyTuition").innerText = "₹" + monthlyTuition;
        document.getElementById("tuitionMonths").innerText = tuitionMonths;
        document.getElementById("transportFees").innerText = "₹" + transportFees;
        document.getElementById("transportMonths").innerText = transportMonths;
        document.getElementById("prevRemain").innerText = "₹" + prevRemain;
        document.getElementById("discount").innerText = "₹" + discount;
        document.getElementById("totalPaid").innerText = "₹" + totalPaid;

        let bal = document.getElementById("feeBalance");
        bal.innerText = "₹" + feeBalance;
        bal.style.color = feeBalance > 0 ? "red" : "green";

        document.getElementById("loginBox").style.display = "none";
        document.getElementById("loader").style.display = "none";
        document.getElementById("portal").style.display = "block";

        populateFeeSelectors();
        setupFeeBalancePayment();

    } catch (e) {
        console.error(e);
        alert("Error loading data");
        document.getElementById("loader").style.display = "none";
        document.getElementById("loginBtn").disabled = false;
    }
}

function logout() {
    location.reload();
}

function populateFeeSelectors() {
    const tuition = document.getElementById("calcTuitionMonths");
    const transport = document.getElementById("calcTransportMonths");
    const exam = document.getElementById("calcExamMonths");

    for (let i = 0; i <= 12; i++) tuition.innerHTML += `<option value="${i}">${i}</option>`;
    for (let i = 0; i <= 11; i++) transport.innerHTML += `<option value="${i}">${i}</option>`;
    for (let i = 0; i <= 2; i++) exam.innerHTML += `<option value="${i}">${i}</option>`;

    tuition.addEventListener("change", calculateFees);
    transport.addEventListener("change", calculateFees);
    exam.addEventListener("change", calculateFees);
}

function calculateFees() {
    const t = parseInt(document.getElementById("calcTuitionMonths").value);
    const tr = parseInt(document.getElementById("calcTransportMonths").value);
    const ex = parseInt(document.getElementById("calcExamMonths").value);

    const monthly = parseFloat(document.getElementById("monthlyTuition").innerText.replace("₹", ""));
    const transport = parseFloat(document.getElementById("transportFees").innerText.replace("₹", ""));
    const discount = parseFloat(document.getElementById("discount").innerText.replace("₹", ""));

    const examFee = 500;

    let total = (t * (monthly - discount)) + (tr * transport) + (ex * examFee);

    document.getElementById("calcTotal").innerText = "₹" + total;

    // Pay Now button
    document.getElementById("payNowBtn").onclick = () => {
        if (total <= 0) {
            alert("Please select months before paying");
            return;
        }

        const upi = "pinnacleglobalschool.62697340@hdfcbank";
        const adm = document.getElementById("adm").innerText.trim();
        const name = document.getElementById("studentName").innerText.trim();
        const cls = document.getElementById("class").innerText.trim();
        const note = `${adm} ${name} ${cls} FEE`;

        const link = `upi://pay?pa=${upi}&pn=Pinnacle Global School&am=${total}&cu=INR&tn=${encodeURIComponent(note)}`;
        window.location.href = link;
    };
}

function setupFeeBalancePayment() {
    const btn = document.getElementById("payBalanceBtn");

    btn.addEventListener("click", () => {
        let text = document.getElementById("feeBalance").innerText.replace(/[^0-9]/g, "");
        let amount = parseFloat(text);

        if (amount <= 0) {
            alert("No balance to pay");
            return;
        }

        const upi = "pinnacleglobalschool.62697340@hdfcbank";
        const adm = document.getElementById("adm").innerText.trim();
        const name = document.getElementById("studentName").innerText.trim();
        const cls = document.getElementById("class").innerText.trim();
        const note = `${adm} ${name} ${cls} FEE`;

        const link = `upi://pay?pa=${upi}&pn=Pinnacle Global School&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
        window.location.href = link;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("loginBtn").addEventListener("click", login);
    document.getElementById("loginCode").addEventListener("keypress", function (e) {
        if (e.key === "Enter") login();
    });
});
