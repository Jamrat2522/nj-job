/* asset-manifest.js — สร้างอัตโนมัติจาก build.js ห้ามแก้ด้วยมือ
   URL ของ Asset ทุกตัวประกาศที่นี่ที่เดียว · ไม่มีข้อมูลลับ */
window.NJHR_ASSETS = {
  "buildId": "njhr-v2-65e2f419",
  "runtime": {
    "namespace": "runtime/namespace.js?v=815b8995",
    "core": "runtime/core.js?v=614ea801"
  },
  "modules": {
    "dashboard": {
      "url": "views/dashboard.js?v=3296b92f",
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
      "url": "runtime/shared/requests.js?v=07450309",
      "deps": [
        "shared-attachments"
      ],
      "provides": []
    },
    "shared-leave-meta": {
      "url": "runtime/shared/leave-meta.js?v=91d7979b",
      "deps": [],
      "provides": []
    },
    "shared-attachments": {
      "url": "runtime/shared/attachments.js?v=bd8779fa",
      "deps": [],
      "provides": []
    },
    "employees": {
      "url": "views/employees/list.js?v=3df4b182",
      "deps": [
        "shared-emp-meta",
        "shared-hr-meta"
      ],
      "provides": [
        "viewEmployees"
      ]
    },
    "attendance": {
      "url": "views/attendance/main.js?v=8c3715c4",
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
      "url": "views/attendance/report.js?v=b5031a78",
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
    "leave-form": {
      "url": "views/leave/form.js?v=fccc2bf7",
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
      "url": "views/ot/form.js?v=fa9a4cc2",
      "deps": [
        "ot",
        "shared-requests",
        "shared-attachments"
      ],
      "provides": []
    },
    "profile": {
      "url": "views/profile/main.js?v=941063df",
      "deps": [
        "shared-hr-meta"
      ],
      "provides": [
        "viewProfile"
      ]
    },
    "hr-docs": {
      "url": "views/profile/hrdocs.js?v=dafb3983",
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
    "compatibility": {
      "url": "compat/app-legacy.js?v=ef3f930e",
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
    "main": "styles.css?v=f384017b",
    "mobile": "mobile.css?v=1936a3b3"
  }
};
