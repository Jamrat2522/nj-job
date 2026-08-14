/* asset-manifest.js — สร้างอัตโนมัติจาก build.js ห้ามแก้ด้วยมือ
   URL ของ Asset ทุกตัวประกาศที่นี่ที่เดียว · ไม่มีข้อมูลลับ */
window.NJHR_ASSETS = {
  "buildId": "njhr-v2-25ec7aed",
  "runtime": {
    "namespace": "runtime/namespace.js?v=815b8995",
    "core": "runtime/core.js?v=877bb563"
  },
  "modules": {
    "dashboard": {
      "url": "views/dashboard.js?v=3111362b",
      "deps": [
        "shared-leave-meta"
      ],
      "provides": [
        "viewDashboard"
      ]
    },
    "shared-emp-meta": {
      "url": "runtime/shared/emp-meta.js?v=3436375a",
      "deps": [],
      "provides": []
    },
    "shared-hr-meta": {
      "url": "runtime/shared/hr-meta.js?v=f412e009",
      "deps": [],
      "provides": []
    },
    "shared-report": {
      "url": "runtime/shared/report-export.js?v=711627a7",
      "deps": [],
      "provides": []
    },
    "shared-requests": {
      "url": "runtime/shared/requests.js?v=bf462379",
      "deps": [],
      "provides": []
    },
    "shared-leave-meta": {
      "url": "runtime/shared/leave-meta.js?v=91d7979b",
      "deps": [],
      "provides": []
    },
    "shared-attachments": {
      "url": "runtime/shared/attachments.js?v=5f532921",
      "deps": [],
      "provides": []
    },
    "employees": {
      "url": "views/employees/list.js?v=12a33405",
      "deps": [
        "shared-emp-meta",
        "shared-hr-meta"
      ],
      "provides": [
        "viewEmployees"
      ]
    },
    "attendance": {
      "url": "views/attendance/main.js?v=d7fa63aa",
      "deps": [
        "shared-report",
        "shared-requests"
      ],
      "provides": [
        "viewAttendance"
      ]
    },
    "requests-leave": {
      "url": "views/leave/main.js?v=5911afa7",
      "deps": [
        "shared-requests",
        "shared-hr-meta",
        "shared-leave-meta"
      ],
      "provides": [
        "viewRequests",
        "viewReqHistory",
        "viewLeave"
      ]
    },
    "ot": {
      "url": "views/ot/main.js?v=8c1c27cb",
      "deps": [
        "shared-requests"
      ],
      "provides": [
        "viewOT"
      ]
    },
    "attendance-report": {
      "url": "views/attendance/report.js?v=623b41f2",
      "deps": [
        "shared-report",
        "shared-requests",
        "shared-emp-meta",
        "shared-leave-meta"
      ],
      "provides": [
        "viewReports"
      ]
    },
    "report-menu": {
      "url": "views/reports/menu.js?v=0db701d5",
      "deps": [
        "shared-report",
        "shared-leave-meta"
      ],
      "provides": [
        "viewRptLeave",
        "viewRptOT",
        "viewRptWht50"
      ]
    },
    "employees-form": {
      "url": "views/employees/form.js?v=88d9ac35",
      "deps": [
        "employees",
        "shared-emp-meta",
        "shared-hr-meta"
      ],
      "provides": []
    },
    "employees-documents": {
      "url": "views/employees/documents.js?v=527abd01",
      "deps": [
        "employees",
        "shared-hr-meta"
      ],
      "provides": []
    },
    "employees-import": {
      "url": "views/employees/import.js?v=95dd7594",
      "deps": [
        "employees",
        "shared-report",
        "shared-emp-meta"
      ],
      "provides": []
    },
    "employees-export": {
      "url": "views/employees/export.js?v=a4410fd1",
      "deps": [
        "employees",
        "shared-report",
        "shared-emp-meta"
      ],
      "provides": []
    },
    "attendance-correction": {
      "url": "views/attendance/correction.js?v=66367e10",
      "deps": [
        "attendance"
      ],
      "provides": []
    },
    "leave-form": {
      "url": "views/leave/form.js?v=3ab92496",
      "deps": [
        "requests-leave",
        "shared-leave-meta",
        "shared-attachments",
        "shared-requests"
      ],
      "provides": []
    },
    "request-detail": {
      "url": "views/leave/detail.js?v=33aa1de7",
      "deps": [
        "requests-leave",
        "shared-requests",
        "shared-hr-meta",
        "shared-leave-meta"
      ],
      "provides": []
    },
    "ot-form": {
      "url": "views/ot/form.js?v=aa491edc",
      "deps": [
        "ot",
        "shared-requests",
        "shared-attachments"
      ],
      "provides": []
    },
    "profile-docs": {
      "url": "views/profile/main.js?v=f313e7f7",
      "deps": [
        "shared-emp-meta",
        "shared-hr-meta",
        "shared-report",
        "shared-requests",
        "shared-attachments"
      ],
      "provides": [
        "viewHrDocs",
        "viewProfile"
      ]
    },
    "calendar": {
      "url": "views/calendar/main.js?v=b75cebc3",
      "deps": [
        "shared-report"
      ],
      "provides": [
        "viewCalendar"
      ]
    },
    "notifications": {
      "url": "views/notifications/main.js?v=153dedba",
      "deps": [],
      "provides": [
        "viewNotifications"
      ]
    },
    "compatibility": {
      "url": "compat/app-legacy.js?v=c4debc74",
      "deps": [
        "shared-emp-meta",
        "shared-hr-meta",
        "shared-report",
        "shared-requests",
        "shared-leave-meta",
        "shared-attachments"
      ],
      "provides": [
        "viewPayroll",
        "viewEPayslip",
        "viewApprovalSettings",
        "viewPayItems",
        "viewSSO",
        "viewApprovals",
        "viewAnnouncements",
        "viewUsers",
        "viewDepartments",
        "viewSettings",
        "viewGeofence",
        "viewShifts",
        "viewAudit",
        "viewReportAll"
      ]
    }
  },
  "styles": {
    "main": "styles.css?v=0ce0b08b",
    "mobile": "mobile.css?v=a9b2131a"
  }
};
