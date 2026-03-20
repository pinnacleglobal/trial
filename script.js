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

        let studentClass="", monthlyTuition=0;

        for (let i=1;i<rows.length;i++){
            let r=rows[i];
            if (r[1]==admission){
                studentClass=r[14]||""; // ✅ Column O
                monthlyTuition=parseFloat(r[4])||0;
                globalExamFee=parseFloat(r[9])||0;
                break;
            }
        }

        document.getElementById("studentName").innerText=studentName;
        document.getElementById("class").innerText=studentClass;
        document.getElementById("adm").innerText=admission;
        document.getElementById("examFee").innerText="₹"+globalExamFee;

        document.getElementById("loginBox").style.display="none";
        document.getElementById("loader").style.display="none";
        document.getElementById("portal").style.display="block";

    } catch(e){
        alert("Error loading data");
    }
}

function logout(){ location.reload(); }

document.addEventListener("DOMContentLoaded",()=>{
    document.getElementById("loginBtn").addEventListener("click",login);
});
