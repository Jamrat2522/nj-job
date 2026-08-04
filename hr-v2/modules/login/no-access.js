/* HR V2 — modules/login/no-access.js
   Feature Flag ไม่ผ่าน: บัญชีนี้ยังไม่ได้รับสิทธิ์ทดสอบ V2 */
export function mount(el, ctx) {
  el.innerHTML =
    '<div class="lg-wrap"><div class="lg-card">' +
    '<div class="v2-state"><div class="v2-state-ic">🚧</div>' +
    '<p><b>HR V2 ยังไม่เปิดใช้งานสำหรับบัญชีนี้</b></p>' +
    '<p class="v2-state-d">ระบบใหม่อยู่ระหว่างทดสอบ เปิดเฉพาะผู้ดูแลระบบสูงสุดและผู้ทดสอบที่กำหนดไว้<br>' +
    'กรุณาใช้ระบบเดิมตามปกติ</p>' +
    '<a class="btn btn-primary" href="../">ไปยังระบบเดิม</a> ' +
    '<button class="btn btn-ghost" id="na-out">ออกจากระบบ</button>' +
    '</div></div></div>';
  el.querySelector('#na-out').onclick = async () => {
    await ctx.session.logout();
    location.hash = '#/login'; location.reload();
  };
}
export function unmount() {}
