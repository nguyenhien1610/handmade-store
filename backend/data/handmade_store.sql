BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS Users (
    id_user INTEGER PRIMARY KEY,
    username TEXT,
    password TEXT,
    email TEXT,
    hoten TEXT,
    diachi TEXT,
    sdt TEXT,
    vaitro TEXT,
    ngaytao TEXT
);
CREATE TABLE IF NOT EXISTS cau_hinh (
    khoa TEXT PRIMARY KEY,
    gia_tri TEXT NOT NULL,
    mo_ta TEXT,
    ngaycapnhat TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS chat_read_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        admin_id INTEGER NOT NULL,
        last_read_message_id INTEGER,
        read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, admin_id)
      );
CREATE TABLE IF NOT EXISTS chatbox (
    id_chat INTEGER PRIMARY KEY,
    id_user INTEGER,
    nguoi_gui TEXT,
    noi_dung TEXT,
    thoi_gian_gui TEXT, is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY (id_user) REFERENCES Users(id_user)
);
CREATE TABLE IF NOT EXISTS chi_tiet_don_hang (
    id_ctdh INTEGER PRIMARY KEY,
    id_dh INTEGER,
    id_sp INTEGER,
    soluong INTEGER,
    gia REAL,
    yeucau TEXT,
    FOREIGN KEY (id_dh) REFERENCES don_hang(id_dh),
    FOREIGN KEY (id_sp) REFERENCES san_pham(id_sp)
);
CREATE TABLE IF NOT EXISTS chi_tiet_gio_hang (
    id_ctgh INTEGER PRIMARY KEY,
    id_gh INTEGER,
    id_sp INTEGER,
    soluong INTEGER,
    FOREIGN KEY (id_gh) REFERENCES gio_hang(id_gh),
    FOREIGN KEY (id_sp) REFERENCES san_pham(id_sp)
);
CREATE TABLE IF NOT EXISTS cua_hang_info (
    id INTEGER PRIMARY KEY,
    ten_cua_hang TEXT NOT NULL,
    dia_chi TEXT,
    sdt TEXT,
    email TEXT,
    gio_mo_cua TEXT,
    mo_ta TEXT,
    logo_url TEXT,
    banner_url TEXT,
    ngaycapnhat TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS danh_gia_san_pham (
    id_dg INTEGER PRIMARY KEY AUTOINCREMENT,
    id_sp INTEGER NOT NULL,
    id_user INTEGER NOT NULL,
    id_don_hang INTEGER, -- để verify user đã mua sản phẩm
    diem_so INTEGER CHECK(diem_so >= 1 AND diem_so <= 5),
    binh_luan TEXT,
    ngay_danh_gia TEXT DEFAULT CURRENT_TIMESTAMP,
    trang_thai TEXT DEFAULT 'hien_thi', -- hien_thi, an_di
    FOREIGN KEY (id_sp) REFERENCES san_pham(id_sp) ON DELETE CASCADE,
    FOREIGN KEY (id_user) REFERENCES Users(id_user),
    FOREIGN KEY (id_don_hang) REFERENCES don_hang(id_dh),
    UNIQUE(id_sp, id_user, id_don_hang)
);
CREATE TABLE IF NOT EXISTS don_hang (
    id_dh INTEGER PRIMARY KEY,
    id_user INTEGER,
    ngaydat TEXT,
    tongtien REAL,
    diachigiaohang TEXT,
    sdtnhan TEXT,
    trangthai TEXT,
    note TEXT,
    ngaytao TEXT,
    hinh_thuc_thanh_toan TEXT,
    trang_thai_thanh_toan TEXT,
    ma_xac_nhan TEXT,
    ngay_nhan_du_kien TEXT,
    id_ma_giam_gia INTEGER,
    gia_tri_giam_gia DECIMAL(12,0) DEFAULT 0,
    tong_tien_truoc_giam DECIMAL(12,0),
    FOREIGN KEY (id_user) REFERENCES Users(id_user),
    FOREIGN KEY (id_ma_giam_gia) REFERENCES ma_giam_gia(id_ma)
);
CREATE TABLE IF NOT EXISTS don_hang_rieng (
    id_hdr INTEGER PRIMARY KEY,
    id_user INTEGER,
    mo_ta TEXT,
    ha_tham_khao TEXT,
    gia_uoc_tinh REAL,
    time_done_du_tinh TEXT,
    dia_chi_giao TEXT,
    sdtnhan TEXT,
    ngay_dat TEXT,
    trang_thai TEXT,
    hinh_thuc_thanh_toan TEXT,
    trang_thai_thanh_toan TEXT,
    FOREIGN KEY (id_user) REFERENCES Users(id_user)
);
CREATE TABLE IF NOT EXISTS gio_hang (
    id_gh INTEGER PRIMARY KEY,
    id_user INTEGER,
    ngaytao TEXT,
    noi_bat INTEGER,
    ngaycapnhat TEXT,
    FOREIGN KEY (id_user) REFERENCES Users(id_user)
);
CREATE TABLE IF NOT EXISTS hinh_anh_san_pham (
    id_hinhanh INTEGER PRIMARY KEY AUTOINCREMENT,
    id_sp INTEGER NOT NULL,
    url_hinh_anh TEXT NOT NULL,
    thu_tu INTEGER DEFAULT 0,
    alt_text TEXT DEFAULT NULL,
    FOREIGN KEY (id_sp) REFERENCES san_pham(id_sp) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS lich_su_hoat_dong (
    id_ls INTEGER PRIMARY KEY AUTOINCREMENT,
    id_user INTEGER NOT NULL,
    hanh_dong TEXT NOT NULL, -- them_san_pham, sua_don_hang, xoa_user, etc.
    bang_lien_quan TEXT, -- ten bang bi tac dong
    id_ban_ghi INTEGER, -- id cua ban ghi bi tac dong
    du_lieu_cu TEXT, -- JSON cua du lieu truoc khi thay doi
    du_lieu_moi TEXT, -- JSON cua du lieu sau khi thay doi
    thoi_gian TEXT DEFAULT CURRENT_TIMESTAMP,
    dia_chi_ip TEXT,
    FOREIGN KEY (id_user) REFERENCES Users(id_user)
);
CREATE TABLE IF NOT EXISTS lich_su_ma_giam_gia (
    id_ls INTEGER PRIMARY KEY AUTOINCREMENT,
    id_ma INTEGER NOT NULL,
    id_user INTEGER NOT NULL,
    id_don_hang INTEGER NOT NULL,
    gia_tri_giam_thuc_te DECIMAL(12,0) NOT NULL,
    ngay_su_dung TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ma) REFERENCES ma_giam_gia(id_ma),
    FOREIGN KEY (id_user) REFERENCES Users(id_user),
    FOREIGN KEY (id_don_hang) REFERENCES don_hang(id_dh)
);
CREATE TABLE IF NOT EXISTS lien_he (
    id_lh INTEGER PRIMARY KEY AUTOINCREMENT,
    ho_ten TEXT NOT NULL,
    email TEXT NOT NULL,
    sdt TEXT,
    chu_de TEXT NOT NULL,
    noi_dung TEXT NOT NULL,
    trang_thai TEXT DEFAULT 'chua_xu_ly', -- chua_xu_ly, dang_xu_ly, da_xu_ly
    phan_hoi TEXT,
    id_admin_xu_ly INTEGER,
    ngay_gui TEXT DEFAULT CURRENT_TIMESTAMP,
    ngay_xu_ly TEXT,
    FOREIGN KEY (id_admin_xu_ly) REFERENCES Users(id_user)
);
CREATE TABLE IF NOT EXISTS loai_san_pham (
    id_loai INTEGER PRIMARY KEY,
    ten TEXT,
    mota TEXT,
    ngaytao TEXT
);
CREATE TABLE IF NOT EXISTS ma_giam_gia (
    id_ma INTEGER PRIMARY KEY AUTOINCREMENT,
    ma_code TEXT UNIQUE NOT NULL,
    ten_ma TEXT NOT NULL,
    loai_giam TEXT NOT NULL, -- phan_tram, so_tien
    gia_tri_giam DECIMAL(12,0) NOT NULL,
    gia_tri_don_hang_toi_thieu DECIMAL(12,0) DEFAULT 0,
    so_lan_su_dung_toi_da INTEGER DEFAULT NULL,
    so_lan_da_su_dung INTEGER DEFAULT 0,
    ngay_bat_dau TEXT NOT NULL,
    ngay_ket_thuc TEXT NOT NULL,
    trang_thai TEXT DEFAULT 'hoat_dong', -- hoat_dong, tam_dung, het_han
    ngaytao TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS mang_xa_hoi (
            id_mxh INTEGER PRIMARY KEY AUTOINCREMENT,
            nen_tang TEXT NOT NULL UNIQUE,
            link TEXT
        );
CREATE TABLE IF NOT EXISTS nhan (
    id_nhan INTEGER PRIMARY KEY AUTOINCREMENT,
    ten_nhan TEXT NOT NULL UNIQUE,
    mau_sac_hex TEXT DEFAULT '#CCCCCC',
    mota_nhan TEXT DEFAULT NULL
);
CREATE TABLE IF NOT EXISTS san_pham (
    id_sp INTEGER PRIMARY KEY AUTOINCREMENT,
    ten TEXT NOT NULL,
    mota TEXT DEFAULT NULL,
    gia DECIMAL(12, 0) NOT NULL,
    gia_khuyen_mai DECIMAL(12, 0) DEFAULT NULL,
    id_loai INTEGER NOT NULL,
    id_nhan INTEGER DEFAULT NULL,
    slton INTEGER NOT NULL DEFAULT 0,
    ha_url TEXT DEFAULT NULL,
    noi_bat INTEGER DEFAULT 0,
    ngaytao TEXT DEFAULT CURRENT_TIMESTAMP,
    ngaycapnhat TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_loai) REFERENCES loai_san_pham(id_loai),
    FOREIGN KEY (id_nhan) REFERENCES nhan(id_nhan) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS thong_ke_truy_cap (
    id_tk INTEGER PRIMARY KEY AUTOINCREMENT,
    ngay TEXT NOT NULL,
    so_luot_truy_cap INTEGER DEFAULT 0,
    so_san_pham_xem INTEGER DEFAULT 0,
    so_don_hang_moi INTEGER DEFAULT 0,
    doanh_thu_ngay DECIMAL(12,0) DEFAULT 0,
    UNIQUE(ngay)
);
INSERT INTO "Users" ("id_user","username","password","email","hoten","diachi","sdt","vaitro","ngaytao") VALUES (1,'test','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','test@example.com','Test User',NULL,'0987654321','client','2025-05-24T06:10:56.187Z'),
 (2,'huyen.nguyenhuyen2004','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','huyen.nguyenhuyen2004@gmail.com','Nguyen thi huyen',NULL,'0971972316','client','2025-05-24T06:11:46.423Z'),
 (3,'nthuyen0212','c65737836d6e5ca353f9282e0c927d90a833eb08dd714f83c0e47c04254e5316','nthuyen0212@gmail.com','Nguyen thi huyen',NULL,'0972591942','client','2025-05-25T09:35:01.121Z'),
 (4,'newuser','ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae','newuser@example.com','New User',NULL,'0111222333','client','2025-05-26T13:37:44.252Z'),
 (5,'huyen1232','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','huyen1232@gmail.com','Nguyễn Văn A',NULL,'0974673256','client','2025-05-26T13:46:29.294Z'),
 (6,'thanhthanhth2k4','240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9','thanhthanhth2k4@gmail.com','Hiền',NULL,'0354259833','client','2025-05-26T13:59:39.444Z');
INSERT INTO "cau_hinh" ("khoa","gia_tri","mo_ta","ngaycapnhat") VALUES ('phi_ship_mac_dinh','30000','Phí ship mặc định','2025-05-23 13:58:27'),
 ('don_hang_free_ship','500000','Đơn hàng miễn phí ship từ số tiền này','2025-05-23 13:58:27'),
 ('email_admin','admin@handmadestore.com','Email admin nhận thông báo','2025-05-23 13:58:27'),
 ('so_san_pham_trang_chu','12','Số sản phẩm hiển thị trang chủ','2025-05-23 13:58:27'),
 ('so_san_pham_trang_danh_sach','20','Số sản phẩm mỗi trang danh sách','2025-05-23 13:58:27');
INSERT INTO "cua_hang_info" ("id","ten_cua_hang","dia_chi","sdt","email","gio_mo_cua","mo_ta","logo_url","banner_url","ngaycapnhat") VALUES (1,'Handmade Store','123 Đường ABC, Quận 1, TP.HCM','0123456789','info@handmadestore.com','8:00 - 22:00 (Thứ 2 - Chủ nhật)','Cửa hàng chuyên bán các sản phẩm handmade chất lượng cao',NULL,NULL,'2025-05-23 13:58:27');
INSERT INTO "hinh_anh_san_pham" ("id_hinhanh","id_sp","url_hinh_anh","thu_tu","alt_text") VALUES (1,1,'/uploads/products/1748439333101-Card_Riddle_SSR_Night_Sky''s_Chiffon.png',0,'bờm hoa xuyến chi');
INSERT INTO "loai_san_pham" ("id_loai","ten","mota","ngaytao") VALUES (1,'Phụ kiện đầu','có thể kẹp đầu nha','2025-05-28 13:34:26');
INSERT INTO "mang_xa_hoi" ("id_mxh","nen_tang","link") VALUES (1,'facebook','https://www.facebook.com/Nguyetttri.9041083'),
 (2,'instagram',NULL),
 (3,'tiktok',NULL),
 (4,'shopee',NULL);
INSERT INTO "nhan" ("id_nhan","ten_nhan","mau_sac_hex","mota_nhan") VALUES (1,'Hot','#ff0015','siêu siêu hợp thời');
INSERT INTO "san_pham" ("id_sp","ten","mota","gia","gia_khuyen_mai","id_loai","id_nhan","slton","ha_url","noi_bat","ngaytao","ngaycapnhat") VALUES (1,'bờm hoa xuyến chi','Rất đẹp nha. và còn vô cùng thân thiết',59999,50000,1,1,5,'/uploads/products/1748439333101-Card_Riddle_SSR_Night_Sky''s_Chiffon.png',0,'2025-05-28T13:35:33.115Z','2025-05-28T13:35:33.115Z');
CREATE INDEX idx_chatbox_id_user ON chatbox(id_user);
CREATE INDEX idx_danh_gia_san_pham_id_sp ON danh_gia_san_pham(id_sp);
CREATE INDEX idx_don_hang_ngaydat ON don_hang(ngaydat);
CREATE INDEX idx_don_hang_trangthai ON don_hang(trangthai);
CREATE INDEX idx_id_sp_thu_tu ON hinh_anh_san_pham(id_sp, thu_tu);
CREATE INDEX idx_lien_he_trang_thai ON lien_he(trang_thai);
CREATE INDEX idx_ma_giam_gia_code ON ma_giam_gia(ma_code);
CREATE INDEX idx_ma_giam_gia_trang_thai ON ma_giam_gia(trang_thai);
CREATE INDEX idx_san_pham_id_loai ON san_pham(id_loai);
CREATE INDEX idx_san_pham_noi_bat ON san_pham(noi_bat);
CREATE INDEX idx_thong_ke_ngay ON thong_ke_truy_cap(ngay);
COMMIT;
