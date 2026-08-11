  /* ================= SHARED: FILE UPLOAD (Supabase Storage) =================
     ย้ายมาจาก 06-auth-supabase.js โดยไม่แก้เนื้อใน
     Bucket · Prefix · Path · Header · Content-Type · Return Object · Error — เหมือนเดิมทุกตัวอักษร
     ใช้ร่วมกันโดย leave-form · ot-form · compatibility ================= */
  function sbUploadFile(bucket, prefix, file, empId) {
    if (!sbReady()) return Promise.reject(new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'));
    var ext = (String(file.name).match(/\.[A-Za-z0-9]{1,8}$/) || [''])[0];
    var safe = String(file.name).replace(/\.[^.]*$/, '').replace(/[^\w\-]+/g, '_').slice(0, 40) || 'file';
    var path = prefix + '/' + empId + '/' + Date.now().toString(36) + '-' +
      Math.random().toString(36).slice(2, 7) + '-' + safe + ext;
    return fetch(SB.url + '/storage/v1/object/' + bucket + '/' + encodeURI(path), {
      method: 'POST',
      headers: { 'apikey': SB.key, 'Authorization': 'Bearer ' + SB.key, 'x-upsert': 'false',
                 'Content-Type': file.type || 'application/octet-stream' },
      body: file
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error('อัปโหลดไฟล์แนบไม่สำเร็จ: ' + t.slice(0, 160)); });
      return { name: file.name, size: file.size, type: file.type || '', path: path,
               url: SB.url + '/storage/v1/object/public/' + bucket + '/' + encodeURI(path) };
    });
  }

  function sbUploadLeaveFile(file, empId) { return sbUploadFile('leave-attachments', 'leave', file, empId); }

  function sbUploadOtFile(file, empId) { return sbUploadFile('ot-attachments', 'ot', file, empId); }
