// ==========================================
// MOCK DATA DỰA TRÊN DATABASE SCHEMA
// ==========================================

// 1. NGUOI_DUNG (Users)
export const NGUOI_DUNG = [
  {
    maNguoiDung: "550e8400-e29b-41d4-a716-446655440000", // VARCHAR(36) UUID
    hoTen: "Toan Le",
    ngaySinh: "2000-01-01",
    gioiTinh: 1, // Nam
    email: "toanle@gmail.com",
    matKhau: "123456", // Mock pass
    soDienThoai: "0901234567",
    vaiTro: "admin",
    trangThai: 1, // Đang hoạt động
    emailDaXacThuc: "toanle@gmail.com"
  },
  {
    maNguoiDung: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    hoTen: "Nguyễn Văn A",
    ngaySinh: "1995-05-15",
    gioiTinh: 1,
    email: "vana@gmail.com",
    matKhau: "khach123",
    soDienThoai: "0988888888",
    vaiTro: "user",
    trangThai: 1,
    emailDaXacThuc: "vana@gmail.com"
  },
  {
    maNguoiDung: "7ca7b810-9dad-11d1-80b4-00c04fd430c9",
    hoTen: "Trần Thị B",
    ngaySinh: "1998-10-20",
    gioiTinh: 2, // Nữ
    email: "thib@gmail.com",
    matKhau: "pass123",
    soDienThoai: "0977777777",
    vaiTro: "user",
    trangThai: 0, // Tài khoản bị khóa để test logic
    emailDaXacThuc: "thib@gmail.com"
  }
];
  
  // 2. DIA_CHI (Addresses)
  export const DIA_CHI = [
    {
      maDiaChi: "addr-01",
      MaNguoiDung: "user-01",
      duong: "123 Lê Lợi",
      quan: "Quận 1",
      thanhPho: "TP. Hồ Chí Minh",
      isDefault: 1
    }
  ];
  
  // 3. DANH_MUC (Categories)
  export const DANH_MUC = [
    { maDanhMuc: "cat-01", maDanhMucCha: null, ten: "Thời trang Nữ" },
    { maDanhMuc: "cat-02", maDanhMucCha: "cat-01", ten: "Váy đầm" },
    { maDanhMuc: "cat-03", maDanhMucCha: "cat-01", ten: "Áo sơ mi" }
  ];
  
  // 4. SAN_PHAM (Products)
  export const SAN_PHAM = [
    {
      maSP: "prod-01",
      maDanhMuc: "cat-02",
      ten: "Váy Midi Lụa Xanh Ngọc",
      moTa: "Váy lụa mềm mại, sang trọng thích hợp đi tiệc.",
      gia: 450000,
      anhDaiDien: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500",
      trangThai: 1
    },
    {
      maSP: "prod-02",
      maDanhMuc: "cat-03",
      ten: "Áo Sơ Mi Nữ Trắng Trơn",
      moTa: "Áo sơ mi basic cho dân công sở.",
      gia: 250000,
      anhDaiDien: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500",
      trangThai: 1
    },
    {
      maSP: "prod-03",
      maDanhMuc: "cat-03",
      ten: "Áo Blazer Linen Cấu Trúc",
      moTa: "Chất liệu linen tự nhiên, thoáng mát.",
      gia: 1250000,
      anhDaiDien: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500",
      trangThai: 1
    },
    {
      maSP: "prod-04",
      maDanhMuc: "cat-04",
      ten: "Túi Da Thủ Công Minimalist",
      moTa: "Da thật 100%, thiết kế tối giản.",
      gia: 2100000,
      anhDaiDien: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500",
      trangThai: 1
    }
  ];
  
  // 5. BIEN_THE_SAN_PHAM (Product Variants)
  export const BIEN_THE_SAN_PHAM = [
    { maBienThe: "var-01", maSP: "prod-01", mauSac: "Xanh Ngọc", kichCo: "M", soLuongTon: 15 },
    { maBienThe: "var-02", maSP: "prod-01", mauSac: "Xanh Ngọc", kichCo: "L", soLuongTon: 5 },
    { maBienThe: "var-03", maSP: "prod-02", mauSac: "Trắng", kichCo: "S", soLuongTon: 50 },
    { maBienThe: "var-04", maSP: "prod-03", mauSac: "Beige", kichCo: "L", soLuongTon: 10 },
    { maBienThe: "var-05", maSP: "prod-04", mauSac: "Đen", kichCo: "OS", soLuongTon: 3 }
  ];
  
  // 6. ANH_SAN_PHAM (Product Images)
  export const ANH_SAN_PHAM = [
    { maAnh: "img-01", maSP: "prod-01", urlAnh: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500" },
    { maAnh: "img-02", maSP: "prod-01", urlAnh: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=500" }
  ];
  
  // 7. MA_GIAM_GIA (Vouchers)
  export const MA_GIAM_GIA = [
    {
      maVoucher: "SUMMER2026",
      loai: "phan_tram",
      giaTriGiam: 10, // 10%
      dieuKien: 300000, // Đơn tối thiểu 300k
      ngayBatDau: "2026-06-01",
      hanSuDung: "2026-08-31",
      soLuotSuDung: 100,
      daySuDung: 12
    },
    {
      maVoucher: "GIAM50K",
      loai: "tien_mat",
      giaTriGiam: 50000, 
      dieuKien: 200000,
      ngayBatDau: "2026-01-01",
      hanSuDung: "2026-12-31",
      soLuotSuDung: 500,
      daySuDung: 450
    }
  ];
  
  // 8. GIO_HANG (Cart)
  export const GIO_HANG = [
    {
      maGioHang: "cart-01",
      maNguoiDung: "user-01",
      maVoucher: null,
      tongTien: 450000,
      thoiGianCapNhat: "2026-04-08T15:30:00Z"
    }
  ];
  
  // 9. CHI_TIET_GIO_HANG (Cart Details)
  export const CHI_TIET_GIO_HANG = [
    {
      maChiTiet: "cdetail-01",
      maGioHang: "cart-01",
      maBienThe: "var-01", // Váy lụa xanh ngọc size M
      soLuong: 1,
      donGia: 450000
    },
    {
      maChiTiet: "cdetail-02",
      maGioHang: "cart-01",
      maBienThe: "var-04", // Áo Blazer Linen size L
      soLuong: 1,
      donGia: 1250000
    },
    {
      maChiTiet: "cdetail-03",
      maGioHang: "cart-01",
      maBienThe: "var-05", // Túi da đen
      soLuong: 1,
      donGia: 2100000
    }
  ];
  
  // 10. DON_HANG (Orders)
  export const DON_HANG = [
    {
      maDonHang: "order-01",
      maNguoiDung: "user-01",
      maDiaChi: "addr-01",
      maVoucher: "GIAM50K",
      trangThai: "hoan_thanh",
      tongTien: 250000,
      soTienGiam: 50000,
      ghiChu: "Giao trong giờ hành chính",
      thoiGianDat: "2026-03-15T10:00:00Z"
    }
  ];
  
  // 11. CHI_TIET_DON_HANG (Order Details)
  export const CHI_TIET_DON_HANG = [
    {
      maChiTiet: "odetail-01",
      maDonHang: "order-01",
      maBienThe: "var-03", // Áo sơ mi trắng size S
      soLuong: 1,
      donGia: 250000
    }
  ];
  
  // 12. THANH_TOAN (Payments)
  export const THANH_TOAN = [
    {
      maGiaoDich: "trans-01",
      maDonHang: "order-01",
      phuongThuc: "VNPAY",
      soTien: 200000, // 250k - 50k (voucher)
      trangThai: "thanh_cong",
      thoiGian: "2026-03-15T10:05:00Z"
    }
  ];
  
  // 13. DANH_GIA (Reviews)
  export const DANH_GIA = [
    {
      maDanhGia: "rev-01",
      maNguoiDung: "user-01",
      maSP: "prod-02",
      maChiTietDonHang: "odetail-01",
      soSao: 5,
      noiDung: "Áo rất đẹp, vải mát. Sẽ ủng hộ shop tiếp!",
      soLike: 12
    }
  ];
  
  // 14. ANH_DANH_GIA (Review Images)
  export const ANH_DANH_GIA = [
    {
      maAnh: "revimg-01",
      maDanhGia: "rev-01",
      urlAnh: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=200"
    }
  ];