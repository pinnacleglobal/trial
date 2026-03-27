const sheetID = "1Sy5uBZkjKpGnLdZp2sFuhFORhO1fRqCswfNYHRl73PM"; // Updated Sheet ID
const apiKey = "AIzaSyB5VIy4kIySW7bVrjNYMpL5rkqZ7Oe758E";

const masterSheet = encodeURIComponent("Master Data 2026"); // Updated sheet name
const feesSheet = encodeURIComponent("Fees Collection");
const awSheet = encodeURIComponent("AW");

async function login() {
    const code = document.getElementById("loginCode").value.trim();
    if (!code) { alert("Enter Login Code"); return; }

    document.getElementById("loginBtn").disabled = true;
    document.getElementById("loader").style.display = "block";

    try {
        // 1. Fetch AW Sheet Data
        let resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${awSheet}?key=${apiKey}`);
        let rows = (await resp.json()).values || [];
        let admission = "", studentName = "", father = "", mother = "", phone = "", address = "", photoUrl = "";
        let loginBlocked = false;

        for (let i = 1; i < rows.length; i++) {
            let r = rows[i];
            if (r[29] && r[29].trim() == code) {
                if (r[31] && r[31].toUpperCase() == "TRUE") { loginBlocked = true; break; }
                admission = r[1] || ""; 
                studentName = r[3] || ""; 
                father = r[6] || "";
                mother = r[5] || ""; 
                phone = r[22] || ""; 
                address = r[7] || ""; 
                photoUrl = r[28] || ""; // Column AC
                break;
            }
        }

        if (loginBlocked) { alert("You Cannot Login As You Have Left The School."); location.reload(); return; }
        if (!admission) { alert("Invalid Login Code"); location.reload(); return; }

        // 2. Fetch Master Data
        resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${masterSheet}?key=${apiKey}`);
        rows = (await resp.json()).values || [];
        let studentClass = "", monthlyTuition = 0, tuitionMonths = 0, transportFees = 0, transportMonths = 0, prevRemain = 0, discount = 0, examFee = 1000;

        for (let i = 1; i < rows.length; i++) {
            let r = rows[i]; 
            if (r[1] == admission) {
                studentClass = r[14] || "";
                monthlyTuition = parseFloat(r[4]) || 0; 
                prevRemain = parseFloat(r[3]) || 0;
                discount = parseFloat(r[5]) || 0; 
                tuitionMonths = parseFloat(r[6]) || 0;
                transportFees = parseFloat(r[7]) || 0; 
                transportMonths = parseFloat(r[8]) || 0;
                examFee = parseFloat(r[9]) || 1000;
                break;
            }
        }

        // 3. Populate Student Info & PHOTO
        document.getElementById("studentName").innerText = studentName;
        document.getElementById("welcomeName").innerText = "Welcome, " + studentName;
        document.getElementById("class").innerText = studentClass;
        document.getElementById("adm").innerText = admission;
        document.getElementById("father").innerText = father;
        document.getElementById("mother").innerText = mother;
        document.getElementById("phone").innerText = phone;
        document.getElementById("address").innerText = address;

        // --- PHOTO LOGIC ---
if (photoUrl && photoUrl.trim() !== "") {
    let fileId = "";
    if (photoUrl.includes("id=")) {
        fileId = photoUrl.split("id=")[1].split("&")[0];
    } else if (photoUrl.includes("/d/")) {
        fileId = photoUrl.split("/d/")[1].split("/")[0];
    }

    if (fileId) {
        const photoImg = document.getElementById("studentPhoto");
        // This is the most reliable "Direct Link" for Google Drive images in 2026
        photoImg.src = `https://lh3.googleusercontent.com/u/0/d/${fileId}`;
        
        // Ensure it displays below by making it a block element
        photoImg.style.display = "inline-block"; 
        
        // Fallback: If the link above fails, try the older thumbnail format
        photoImg.onerror = function() {
            this.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w500`;
        };
    }
}
        // 4. Fees Collection
        resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${feesSheet}?key=${apiKey}`);
        rows = (await resp.json()).values || [];
        let table = "", cards = "", totalPaid = 0;

        for (let i = 1; i < rows.length; i++) {
            let r = rows[i]; 
            if (r[2] == admission) {
                let date = r[1] || "", slip = r[0] || "", amount = parseFloat(r[5]) || 0;
                let feeType = r[6] || "", session = r[7] || "", tMonths = r[8] || "", trMonths = r[9] || "", exMonths = r[10] || "", mode = r[11] || "";
                if (session == "2026-27" && feeType.toLowerCase() == "monthly fees") totalPaid += amount;

                table += `<tr><td>${date}</td><td>${slip}</td><td>₹${amount}</td><td>${feeType}</td><td>${session}</td><td>${tMonths}</td><td>${trMonths}</td><td>${exMonths}</td><td>${mode}</td></tr>`;
                cards += `<div class="fee-card"><div><b>Date:</b> ${date}</div><div><b>Slip Number:</b> ${slip}</div><div><b>Amount Paid:</b> ₹${amount}</div><div><b>Fee Type:</b> ${feeType}</div><div><b>Session:</b> ${session}</div><div><b>Tuition Fee Months:</b> ${tMonths}</div><div><b>Transport Fee Months:</b> ${trMonths}</div><div><b>Exam Fee Months:</b> ${exMonths}</div><div><b>Payment Mode:</b> ${mode}</div></div>`;
            }
        }

        // 5. Final Calculation & Display
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
        document.getElementById("examFee").innerText = "₹" + examFee;

        let bal = document.getElementById("feeBalance");
        bal.innerText = "₹" + feeBalance;
        bal.style.color = feeBalance > 0 ? "red" : "green";

        document.getElementById("loginBox").style.display = "none";
        document.getElementById("loader").style.display = "none";
        document.getElementById("portal").style.display = "block";

        populateFeeSelectors(examFee);
        setupFeeBalancePayment();
        setupSendScreenshotButton();

    } catch (e) {
        console.error(e);
        alert("An error occurred during login. Check console for details.");
        document.getElementById("loader").style.display = "none";
        document.getElementById("loginBtn").disabled = false;
    }
}

function logout() { location.reload(); }

function populateFeeSelectors(examFee = 500) {
    const tuition = document.getElementById("calcTuitionMonths");
    const transport = document.getElementById("calcTransportMonths");
    const exam = document.getElementById("calcExamMonths");
    for (let i = 0; i <= 12; i++) tuition.innerHTML += `<option value="${i}">${i}</option>`;
    for (let i = 0; i <= 11; i++) transport.innerHTML += `<option value="${i}">${i}</option>`;
    for (let i = 0; i <= 2; i++) exam.innerHTML += `<option value="${i}">${i}</option>`;
    tuition.addEventListener("change", () => calculateFees(examFee));
    transport.addEventListener("change", () => calculateFees(examFee));
    exam.addEventListener("change", () => calculateFees(examFee));
}

function calculateFees(examFee = 500) {
    const t = parseInt(document.getElementById("calcTuitionMonths").value);
    const tr = parseInt(document.getElementById("calcTransportMonths").value);
    const ex = parseInt(document.getElementById("calcExamMonths").value);

    const monthly = parseFloat(document.getElementById("monthlyTuition").innerText.replace("₹", ""));
    const transport = parseFloat(document.getElementById("transportFees").innerText.replace("₹", ""));
    const discount = parseFloat(document.getElementById("discount").innerText.replace("₹", ""));

    // Take half of the exam fee for Calculate Fees
    let examFeePerMonth = examFee / 2;

    let total = (t * (monthly - discount)) + (tr * transport) + (ex * examFeePerMonth);

    document.getElementById("calcTotal").innerText = "₹" + total;

    document.getElementById("payNowBtn").onclick = () => {
        if (total <= 0) { alert("Please select months before paying"); return; }
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
        if (amount <= 0) { alert("No balance to pay"); return; }
        const upi = "pinnacleglobalschool.62697340@hdfcbank";
        const adm = document.getElementById("adm").innerText.trim();
        const name = document.getElementById("studentName").innerText.trim();
        const cls = document.getElementById("class").innerText.trim();
        const note = `${adm} ${name} ${cls} FEE`;
        const link = `upi://pay?pa=${upi}&pn=Pinnacle Global School&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
        window.location.href = link;
    });
}

function setupSendScreenshotButton() {
    const sendBtns = [
        document.getElementById("sendScreenshotBalanceBtn"),
        document.getElementById("sendScreenshotCalcBtn")
    ].filter(Boolean);

    sendBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const adm = document.getElementById("adm").innerText.trim();
            const name = document.getElementById("studentName").innerText.trim();
            const cls = document.getElementById("class").innerText.trim();
            const message = `Hello, I have completed the fee payment.\nAdmission No: ${adm}\nName: ${name}\nClass: ${cls}\nPlease find the attached screenshot of my payment.`;
            const phone = "917830968000";
            const link = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            window.location.href = link;
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("loginBtn").addEventListener("click", login);
    document.getElementById("loginCode").addEventListener("keypress", function (e) {
        if (e.key === "Enter") login();
    });
});
