/* asset-manifest.js — สร้างอัตโนมัติจาก build.js ห้ามแก้ด้วยมือ
   URL ของ Asset ทุกตัวประกาศที่นี่ที่เดียว · ไม่มีข้อมูลลับ */
window.NJHR_ASSETS = {
  "buildId": "njhr-v2-133f9b44",
  "runtime": {
    "namespace": "runtime/namespace.js?v=815b8995",
    "core": "runtime/core.js?v=d48e9db8"
  },
  "modules": {
    "dashboard": {
      "url": "views/dashboard.js?v=5b419f6b",
      "deps": [],
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
      "url": "runtime/shared/hr-meta.js?v=781668be",
      "deps": [],
      "provides": []
    },
    "shared-report": {
      "url": "runtime/shared/report-export.js?v=711627a7",
      "deps": [],
      "provides": []
    },
    "shared-requests": {
      "url": "runtime/shared/requests.js?v=cd7e445b",
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
      "url": "views/employees/list.js?v=09904fbe",
      "deps": [
        "shared-emp-meta",
        "shared-hr-meta"
      ],
      "provides": [
        "viewEmployees"
      ]
    },
    "attendance": {
      "url": "views/attendance/main.js?v=0ec76b22",
      "deps": [
        "shared-report",
        "shared-requests"
      ],
      "provides": [
        "viewAttendance"
      ]
    },
    "requests-leave": {
      "url": "views/leave/main.js?v=617afb84",
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
      "url": "views/ot/main.js?v=587fb4a7",
      "deps": [
        "shared-requests"
      ],
      "provides": [
        "viewOT"
      ]
    },
    "attendance-report": {
      "url": "views/attendance/report.js?v=449208f4",
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
    "employees-form": {
      "url": "views/employees/form.js?v=3d311a5b",
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
      "url": "views/attendance/correction.js?v=81cf3343",
      "deps": [
        "attendance"
      ],
      "provides": []
    },
    "leave-form": {
      "url": "views/leave/form.js?v=a1f09b7c",
      "deps": [
        "requests-leave",
        "shared-leave-meta",
        "shared-attachments",
        "shared-requests"
      ],
      "provides": []
    },
    "request-detail": {
      "url": "views/leave/detail.js?v=b6236590",
      "deps": [
        "requests-leave",
        "shared-requests",
        "shared-hr-meta",
        "shared-leave-meta"
      ],
      "provides": []
    },
    "ot-form": {
      "url": "views/ot/form.js?v=28ba72f0",
      "deps": [
        "ot",
        "shared-requests",
        "shared-attachments"
      ],
      "provides": []
    },
    "profile-docs": {
      "url": "views/profile/main.js?v=496b043f",
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
      "url": "views/calendar/main.js?v=20368fcd",
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
      "url": "compat/app-legacy.js?v=76dbc88b",
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
        "viewSalaryMerge",
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
    "main": "styles.css?v=7cce639b",
    "mobile": "mobile.css?v=65bc9fcb"
  }
};
