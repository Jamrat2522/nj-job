/* asset-manifest.js — สร้างอัตโนมัติจาก build.js ห้ามแก้ด้วยมือ
   URL ของ Asset ทุกตัวประกาศที่นี่ที่เดียว · ไม่มีข้อมูลลับ */
window.NJHR_ASSETS = {
  "buildId": "njhr-v2-7a36ac88",
  "runtime": {
    "namespace": "runtime/namespace.js?v=815b8995",
    "core": "runtime/core.js?v=93d4f0c5"
  },
  "modules": {
    "dashboard": {
      "url": "views/dashboard.js?v=00aac18c",
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
      "url": "runtime/shared/report-export.js?v=bf841ec5",
      "deps": [],
      "provides": []
    },
    "shared-requests": {
      "url": "runtime/shared/requests.js?v=7432521f",
      "deps": [
        "shared-attachments",
        "shared-leave-meta"
      ],
      "provides": []
    },
    "shared-leave-meta": {
      "url": "runtime/shared/leave-meta.js?v=91d7979b",
      "deps": [],
      "provides": []
    },
    "shared-attachments": {
      "url": "runtime/shared/attachments.js?v=ea27e778",
      "deps": [],
      "provides": []
    },
    "employees": {
      "url": "views/employees/list.js?v=129ec3e6",
      "deps": [
        "shared-emp-meta",
        "shared-hr-meta"
      ],
      "provides": [
        "viewEmployees"
      ]
    },
    "attendance": {
      "url": "views/attendance/main.js?v=6f58dc40",
      "deps": [
        "shared-report",
        "shared-requests"
      ],
      "provides": [
        "viewAttendance"
      ]
    },
    "requests-leave": {
      "url": "views/leave/main.js?v=2ba13cef",
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
      "url": "views/ot/main.js?v=5ca1d984",
      "deps": [
        "shared-requests"
      ],
      "provides": [
        "viewOT"
      ]
    },
    "attendance-report": {
      "url": "views/attendance/report.js?v=0056dcd4",
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
      "url": "views/employees/form.js?v=6da9c22b",
      "deps": [
        "employees",
        "shared-emp-meta",
        "shared-hr-meta"
      ],
      "provides": []
    },
    "employees-documents": {
      "url": "views/employees/documents.js?v=b64758df",
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
    "resign-form": {
      "url": "views/leave/resign-form.js?v=f72f22b4",
      "deps": [
        "shared-attachments"
      ],
      "provides": []
    },
    "leave-form": {
      "url": "views/leave/form.js?v=43e69a91",
      "deps": [
        "requests-leave",
        "shared-leave-meta",
        "shared-attachments",
        "shared-requests"
      ],
      "provides": []
    },
    "request-detail": {
      "url": "views/leave/detail.js?v=a7a182b3",
      "deps": [
        "requests-leave",
        "shared-requests",
        "shared-hr-meta",
        "shared-leave-meta"
      ],
      "provides": []
    },
    "ot-form": {
      "url": "views/ot/form.js?v=6fee3a9e",
      "deps": [
        "ot",
        "shared-requests",
        "shared-attachments"
      ],
      "provides": []
    },
    "profile": {
      "url": "views/profile/main.js?v=4117723c",
      "deps": [
        "shared-hr-meta"
      ],
      "provides": [
        "viewProfile"
      ]
    },
    "hr-docs": {
      "url": "views/profile/hrdocs.js?v=3501728d",
      "deps": [
        "shared-emp-meta",
        "shared-hr-meta",
        "shared-report",
        "shared-requests",
        "shared-attachments"
      ],
      "provides": [
        "viewHrDocs"
      ]
    },
    "calendar": {
      "url": "views/calendar/main.js?v=d9bc6603",
      "deps": [
        "shared-report"
      ],
      "provides": [
        "viewCalendar"
      ]
    },
    "notifications": {
      "url": "views/notifications/main.js?v=5ee020d1",
      "deps": [],
      "provides": [
        "viewNotifications"
      ]
    },
    "approvals-reports": {
      "url": "compat/approvals-reports.js?v=85af0e58",
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
        "viewGeofence",
        "viewShifts",
        "viewReportAll"
      ]
    },
    "announce": {
      "url": "views/announce/board.js?v=96b42856",
      "deps": [
        "shared-report"
      ],
      "provides": [
        "viewAnnBoard",
        "viewAnnDone"
      ]
    },
    "admin-users": {
      "url": "compat/admin-users.js?v=8ab872bc",
      "deps": [
        "approvals-reports"
      ],
      "provides": [
        "viewAnnouncements",
        "viewUsers",
        "viewDepartments",
        "viewSettings",
        "viewAudit"
      ]
    }
  },
  "styles": {
    "main": "styles.css?v=045607c6",
    "mobile": "mobile.css?v=a54fec67"
  }
};
