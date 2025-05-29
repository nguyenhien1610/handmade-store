// backend/models/socialMediaModel.js
const Database = require('../../config/database');
const db = Database;// better-sqlite3 instance

function getAllSocialMediaLinks() {
    try {
        const stmt = db.prepare("SELECT nen_tang, link FROM mang_xa_hoi");
        const rows = stmt.all();
        
        const linksObject = rows.reduce((acc, row) => {
            acc[row.nen_tang] = row.link || '';
            return acc;
        }, {});
        
        const defaultKeys = { facebook: '', instagram: '', tiktok: '', shopee: '' };
        return { ...defaultKeys, ...linksObject };

    } catch (error) {
        console.error("Lỗi khi lấy link mạng xã hội từ model:", error);
        throw error;
    }
}

// Cập nhật các link mạng xã hội với logic UPSERT
function updateSocialMediaLinks(links) {
    // links là một object dạng: { facebook: 'link_fb', instagram: 'link_ig', ... }
    try {
        // Câu lệnh UPSERT:
        // - Cố gắng INSERT một bản ghi mới.
        // - Nếu có xung đột khóa UNIQUE trên cột 'nen_tang' (nghĩa là nen_tang đã tồn tại),
        //   thì thay vào đó, thực hiện UPDATE cột 'link' của bản ghi hiện có.
        // - 'excluded.link' tham chiếu đến giá trị 'link' mà bạn đang cố gắng INSERT.
        const upsertStmt = db.prepare(`
            INSERT INTO mang_xa_hoi (nen_tang, link)
            VALUES (:platform, :linkValue)
            ON CONFLICT(nen_tang) DO UPDATE SET
                link = excluded.link;
        `);

        // Nếu bạn muốn xóa bản ghi khi người dùng xóa link (gửi link rỗng/null)
        const deleteStmt = db.prepare("DELETE FROM mang_xa_hoi WHERE nen_tang = ? AND (? IS NULL OR ? = '')");


        const transaction = db.transaction(() => {
            for (const platform in links) {
                if (Object.hasOwnProperty.call(links, platform)) {
                    const newLink = links[platform] ? links[platform].trim() : null; // Chuẩn hóa link, nếu rỗng thì là null

                    if (newLink && newLink !== '') {
                        // Nếu có link mới, thực hiện UPSERT
                        upsertStmt.run({ platform: platform, linkValue: newLink });
                    } else {
                        // Nếu link mới là null hoặc rỗng
                        // Tùy chọn 1: Cập nhật link thành NULL (Upsert sẽ làm điều này nếu linkValue là NULL)
                        upsertStmt.run({ platform: platform, linkValue: null });
                        
                        // Tùy chọn 2: Xóa hẳn bản ghi nếu link bị xóa (cân nhắc nếu bạn không muốn giữ bản ghi nền tảng khi không có link)
                        // deleteStmt.run(platform, newLink, newLink); // newLink sẽ là null hoặc ''
                        // LƯU Ý: Nếu bạn chọn xóa, hãy đảm bảo getAllSocialMediaLinks vẫn hoạt động đúng
                        // bằng cách luôn trả về tất cả các key mặc định.
                    }
                }
            }
        });
        transaction();
        return { message: "Cấu hình mạng xã hội đã được cập nhật thành công." };
    } catch (error) {
        console.error("Lỗi khi cập nhật link mạng xã hội từ model (UPSERT):", error);
        throw error;
    }
}
// backend/models/socialMediaModel.js
// Giả sử bạn dùng UPSERT
async function updateSocialMediaLinks(links) {
    console.log("MODEL: updateSocialMediaLinks - Function REACHED. Received links:", links);
    try {
        // SỬA Ở ĐÂY: Thêm (nen_tang) vào sau ON CONFLICT
        const upsertStmt = db.prepare(`
            INSERT INTO mang_xa_hoi (nen_tang, link)
            VALUES (:platform, :linkValue)
            ON CONFLICT(nen_tang) DO UPDATE SET  -- << Đảm bảo có (nen_tang) ở đây
                link = excluded.link;
        `);

        const transaction = db.transaction(() => {
            for (const platform in links) {
                if (Object.hasOwnProperty.call(links, platform)) {
                    const linkValue = links[platform] ? links[platform].trim() : null;
                    console.log(`MODEL: UPSERTING - Platform: ${platform}, Link: ${linkValue}`);
                    upsertStmt.run({ platform: platform, linkValue: linkValue });
                }
            }
        });

        console.log("MODEL: Executing transaction...");
        transaction();
        console.log("MODEL: Transaction completed.");
        return { success: true, message: "Cập nhật CSDL thành công" };

    } catch (error) {
        console.error("MODEL ERROR in updateSocialMediaLinks:", error.message, error.stack);
        throw error;
    }
}
module.exports = {
    getAllSocialMediaLinks,
    updateSocialMediaLinks,
};