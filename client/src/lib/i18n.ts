import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  ms: 'Bahasa Malaysia', 
  'zh-cn': '简体中文',
  es: 'Español',
  ja: '日本語',
  ko: '한국어'
} as const;

export type Language = keyof typeof SUPPORTED_LANGUAGES;

// Translation keys for the guest check-in form
export interface Translations {
  // Header and welcome
  welcomeTitle: string;
  completeCheckIn: string;
  assignedCapsule: string;
  prefilledInfo: string;
  
  // Personal Information Section
  personalInfo: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  contactNumberLabel: string; 
  contactNumberPlaceholder: string;
  genderLabel: string;
  genderPlaceholder: string;
  male: string;
  female: string;
  nationalityLabel: string;
  nationalityPlaceholder: string;

  // Identity Documents Section  
  identityDocs: string;
  identityDocsDesc: string;
  icNumberLabel: string;
  icNumberPlaceholder: string;
  passportNumberLabel: string;
  passportNumberPlaceholder: string;
  icPhotoLabel: string;
  icPhotoDesc: string;
  passportPhotoLabel: string;
  passportPhotoDesc: string;
  chooseFile: string;

  // Payment Section
  paymentMethod: string;
  paymentMethodPlaceholder: string;
  cash: string;
  card: string;
  onlineTransfer: string;
  paymentNote: string;

  // Buttons and Actions
  completeCheckInBtn: string;
  completingCheckIn: string;
  editInfo: string;

  // Success Page
  goodDay: string;
  welcomeHostel: string;
  address: string;
  hostelPhotos: string;
  googleMaps: string;
  checkInVideo: string;
  checkInTime: string;
  checkOutTime: string;
  doorPassword: string;
  capsuleNumber: string;
  accessCard: string;
  importantReminders: string;
  noCardWarning: string;
  noSmoking: string;
  cctvWarning: string;
  infoEditable: string;
  editUntil: string;
  editMyInfo: string;
  assistance: string;
  enjoyStay: string;

  // Loading and Error States
  validatingLink: string;
  invalidLink: string;
  invalidLinkDesc: string;
  expiredLink: string;
  expiredLinkDesc: string;
  error: string;
  validationError: string;
  checkInFailed: string;
  checkInSuccess: string;
  checkInSuccessDesc: string;

  // Language Switcher
  selectLanguage: string;
  currentLanguage: string;
}

// English translations (default)
const enTranslations: Translations = {
  welcomeTitle: "Welcome to Pelangi Capsule Hostel",
  completeCheckIn: "Complete your check-in information",
  assignedCapsule: "Your assigned capsule",
  prefilledInfo: "Pre-filled Information:",

  personalInfo: "Personal Information", 
  fullNameLabel: "Full Name as in IC/Passport *",
  fullNamePlaceholder: "Enter your name as shown in ID",
  contactNumberLabel: "Contact Number *",
  contactNumberPlaceholder: "Enter your contact number (e.g., +60123456789)",
  genderLabel: "Gender *",
  genderPlaceholder: "Select gender",
  male: "Male",
  female: "Female", 
  nationalityLabel: "Nationality *",
  nationalityPlaceholder: "e.g., Malaysian, Singaporean",

  identityDocs: "Identity Documents *",
  identityDocsDesc: "Please provide either IC or Passport information with document photo:",
  icNumberLabel: "IC Number (for Malaysians)",
  icNumberPlaceholder: "e.g., 950101-01-1234",
  passportNumberLabel: "Passport Number (for Foreigners)",
  passportNumberPlaceholder: "e.g., A12345678",
  icPhotoLabel: "IC Document Photo",
  icPhotoDesc: "Upload photo of your IC",
  passportPhotoLabel: "Passport Document Photo", 
  passportPhotoDesc: "Upload photo of your passport",
  chooseFile: "Choose File",

  paymentMethod: "Payment Method *",
  paymentMethodPlaceholder: "Select preferred payment method",
  cash: "Cash",
  card: "Credit/Debit Card",
  onlineTransfer: "Online Transfer",
  paymentNote: "Payment will be collected at the front desk upon arrival",

  completeCheckInBtn: "Complete Check-in",
  completingCheckIn: "Completing Check-in...",
  editInfo: "Edit My Information",

  goodDay: "Good Day, Our Honorable Guest!",
  welcomeHostel: "Welcome to Pelangi Capsule Hostel",
  address: "Address:",
  hostelPhotos: "📸 Hostel Photos",
  googleMaps: "📍 Google Maps", 
  checkInVideo: "🎥 Check-in Video",
  checkInTime: "Check-in: From 3:00 PM",
  checkOutTime: "Check-out: Before 12:00 PM",
  doorPassword: "Door Password:",
  capsuleNumber: "Your Capsule No.:",
  accessCard: "Capsule Access Card: Placed on your pillow",
  importantReminders: "Important Reminders:",
  noCardWarning: "🚫 Do not leave your card inside the capsule and close the door",
  noSmoking: "🚭 No Smoking in hostel area", 
  cctvWarning: "🎥 CCTV monitored – Violation (e.g., smoking) may result in RM300 penalty",
  infoEditable: "Information Editable",
  editUntil: "You can edit your check-in information until",
  editMyInfo: "Edit My Information",
  assistance: "For any assistance, please contact reception.",
  enjoyStay: "Enjoy your stay at Pelangi Capsule Hostel! 💼🌟",

  validatingLink: "Validating check-in link...",
  invalidLink: "Invalid Link",
  invalidLinkDesc: "This check-in link is invalid or missing a token.",
  expiredLink: "Invalid or Expired Link", 
  expiredLinkDesc: "This check-in link is invalid or has expired.",
  error: "Error",
  validationError: "Failed to validate check-in link.",
  checkInFailed: "Check-in Failed",
  checkInSuccess: "Check-in Successful!",
  checkInSuccessDesc: "Welcome to Pelangi Capsule Hostel! You've been assigned to",

  selectLanguage: "Select Language",
  currentLanguage: "English"
};

// Malay translations
const msTranslations: Translations = {
  welcomeTitle: "Selamat Datang ke Pelangi Capsule Hostel",
  completeCheckIn: "Lengkapkan maklumat daftar masuk anda",
  assignedCapsule: "Kapsul yang ditetapkan untuk anda",
  prefilledInfo: "Maklumat Pra-diisi:",

  personalInfo: "Maklumat Peribadi",
  fullNameLabel: "Nama Penuh seperti dalam IC/Pasport *",
  fullNamePlaceholder: "Masukkan nama anda seperti yang ditunjukkan dalam ID",
  contactNumberLabel: "Nombor Hubungan *",
  contactNumberPlaceholder: "Masukkan nombor hubungan anda (cth: +60123456789)",
  genderLabel: "Jantina *",
  genderPlaceholder: "Pilih jantina",
  male: "Lelaki",
  female: "Perempuan",
  nationalityLabel: "Kewarganegaraan *",
  nationalityPlaceholder: "cth: Malaysia, Singapura",

  identityDocs: "Dokumen Pengenalan *",
  identityDocsDesc: "Sila berikan maklumat IC atau Pasport dengan foto dokumen:",
  icNumberLabel: "Nombor IC (untuk rakyat Malaysia)",
  icNumberPlaceholder: "cth: 950101-01-1234",
  passportNumberLabel: "Nombor Pasport (untuk warga asing)",
  passportNumberPlaceholder: "cth: A12345678",
  icPhotoLabel: "Foto Dokumen IC",
  icPhotoDesc: "Muat naik foto IC anda",
  passportPhotoLabel: "Foto Dokumen Pasport",
  passportPhotoDesc: "Muat naik foto pasport anda",
  chooseFile: "Pilih Fail",

  paymentMethod: "Kaedah Pembayaran *",
  paymentMethodPlaceholder: "Pilih kaedah pembayaran pilihan",
  cash: "Tunai",
  card: "Kad Kredit/Debit",
  onlineTransfer: "Pemindahan Online",
  paymentNote: "Pembayaran akan dikutip di meja depan semasa ketibaan",

  completeCheckInBtn: "Lengkapkan Daftar Masuk",
  completingCheckIn: "Melengkapkan Daftar Masuk...",
  editInfo: "Edit Maklumat Saya",

  goodDay: "Selamat Datang, Tetamu Terhormat Kami!",
  welcomeHostel: "Selamat Datang ke Pelangi Capsule Hostel",
  address: "Alamat:",
  hostelPhotos: "📸 Foto Hostel",
  googleMaps: "📍 Google Maps",
  checkInVideo: "🎥 Video Daftar Masuk",
  checkInTime: "Daftar Masuk: Dari 3:00 PM",
  checkOutTime: "Daftar Keluar: Sebelum 12:00 PM",
  doorPassword: "Kata Laluan Pintu:",
  capsuleNumber: "Nombor Kapsul Anda:",
  accessCard: "Kad Akses Kapsul: Diletakkan di atas bantal anda",
  importantReminders: "Peringatan Penting:",
  noCardWarning: "🚫 Jangan tinggalkan kad anda di dalam kapsul dan tutup pintu",
  noSmoking: "🚭 Dilarang Merokok di kawasan hostel",
  cctvWarning: "🎥 Dipantau CCTV – Pelanggaran (cth: merokok) boleh dikenakan denda RM300",
  infoEditable: "Maklumat Boleh Diedit",
  editUntil: "Anda boleh edit maklumat daftar masuk sehingga",
  editMyInfo: "Edit Maklumat Saya",
  assistance: "Untuk sebarang bantuan, sila hubungi kaunter penerimaan.",
  enjoyStay: "Nikmati penginapan anda di Pelangi Capsule Hostel! 💼🌟",

  validatingLink: "Mengesahkan pautan daftar masuk...",
  invalidLink: "Pautan Tidak Sah",
  invalidLinkDesc: "Pautan daftar masuk ini tidak sah atau tiada token.",
  expiredLink: "Pautan Tidak Sah atau Tamat Tempoh",
  expiredLinkDesc: "Pautan daftar masuk ini tidak sah atau telah tamat tempoh.",
  error: "Ralat",
  validationError: "Gagal untuk mengesahkan pautan daftar masuk.",
  checkInFailed: "Daftar Masuk Gagal",
  checkInSuccess: "Daftar Masuk Berjaya!",
  checkInSuccessDesc: "Selamat datang ke Pelangi Capsule Hostel! Anda telah ditetapkan ke",

  selectLanguage: "Pilih Bahasa",
  currentLanguage: "Bahasa Malaysia"
};

// Chinese translations
const zhTranslations: Translations = {
  welcomeTitle: "欢迎来到彩虹胶囊旅舍",
  completeCheckIn: "完成您的入住信息",
  assignedCapsule: "您被分配的胶囊",
  prefilledInfo: "预填信息:",

  personalInfo: "个人信息",
  fullNameLabel: "身份证/护照上的全名 *",
  fullNamePlaceholder: "输入身份证件上显示的姓名",
  contactNumberLabel: "联系电话 *",
  contactNumberPlaceholder: "输入您的联系电话 (例如: +60123456789)",
  genderLabel: "性别 *",
  genderPlaceholder: "选择性别",
  male: "男性",
  female: "女性",
  nationalityLabel: "国籍 *",
  nationalityPlaceholder: "例如: 马来西亚, 新加坡",

  identityDocs: "身份证件 *",
  identityDocsDesc: "请提供身份证或护照信息以及证件照片:",
  icNumberLabel: "身份证号码 (马来西亚人)",
  icNumberPlaceholder: "例如: 950101-01-1234",
  passportNumberLabel: "护照号码 (外国人)",
  passportNumberPlaceholder: "例如: A12345678",
  icPhotoLabel: "身份证照片",
  icPhotoDesc: "上传您的身份证照片",
  passportPhotoLabel: "护照照片",
  passportPhotoDesc: "上传您的护照照片",
  chooseFile: "选择文件",

  paymentMethod: "付款方式 *",
  paymentMethodPlaceholder: "选择首选付款方式",
  cash: "现金",
  card: "信用卡/借记卡",
  onlineTransfer: "网上转账",
  paymentNote: "到达时将在前台收取付款",

  completeCheckInBtn: "完成入住",
  completingCheckIn: "正在完成入住...",
  editInfo: "编辑我的信息",

  goodDay: "您好，我们尊贵的客人！",
  welcomeHostel: "欢迎来到彩虹胶囊旅舍",
  address: "地址:",
  hostelPhotos: "📸 旅舍照片",
  googleMaps: "📍 谷歌地图",
  checkInVideo: "🎥 入住视频",
  checkInTime: "入住: 下午3:00开始",
  checkOutTime: "退房: 上午12:00之前",
  doorPassword: "门密码:",
  capsuleNumber: "您的胶囊号码:",
  accessCard: "胶囊门卡: 放在您的枕头上",
  importantReminders: "重要提醒:",
  noCardWarning: "🚫 请勿将门卡留在胶囊内并关闭门",
  noSmoking: "🚭 旅舍区域内禁止吸烟",
  cctvWarning: "🎥 有监控摄像头 - 违规行为(如吸烟)可能被罚款300马币",
  infoEditable: "信息可编辑",
  editUntil: "您可以编辑入住信息直到",
  editMyInfo: "编辑我的信息",
  assistance: "如需任何帮助，请联系前台。",
  enjoyStay: "祝您在彩虹胶囊旅舍住宿愉快！💼🌟",

  validatingLink: "验证入住链接中...",
  invalidLink: "无效链接",
  invalidLinkDesc: "此入住链接无效或缺少令牌。",
  expiredLink: "无效或过期链接",
  expiredLinkDesc: "此入住链接无效或已过期。",
  error: "错误",
  validationError: "验证入住链接失败。",
  checkInFailed: "入住失败",
  checkInSuccess: "入住成功！",
  checkInSuccessDesc: "欢迎来到彩虹胶囊旅舍！您已被分配到",

  selectLanguage: "选择语言",
  currentLanguage: "简体中文"
};

// Spanish translations
const esTranslations: Translations = {
  welcomeTitle: "Bienvenido a Pelangi Capsule Hostel",
  completeCheckIn: "Complete su información de registro",
  assignedCapsule: "Su cápsula asignada",
  prefilledInfo: "Información Pre-rellenada:",

  personalInfo: "Información Personal",
  fullNameLabel: "Nombre Completo según ID/Pasaporte *",
  fullNamePlaceholder: "Ingrese su nombre como aparece en el ID",
  contactNumberLabel: "Número de Contacto *",
  contactNumberPlaceholder: "Ingrese su número de contacto (ej: +60123456789)",
  genderLabel: "Género *",
  genderPlaceholder: "Seleccionar género",
  male: "Masculino",
  female: "Femenino",
  nationalityLabel: "Nacionalidad *",
  nationalityPlaceholder: "ej: Malasio, Singapurense",

  identityDocs: "Documentos de Identidad *",
  identityDocsDesc: "Proporcione información de ID o Pasaporte con foto del documento:",
  icNumberLabel: "Número de ID (para malasios)",
  icNumberPlaceholder: "ej: 950101-01-1234",
  passportNumberLabel: "Número de Pasaporte (para extranjeros)",
  passportNumberPlaceholder: "ej: A12345678",
  icPhotoLabel: "Foto del Documento ID",
  icPhotoDesc: "Subir foto de su ID",
  passportPhotoLabel: "Foto del Documento Pasaporte",
  passportPhotoDesc: "Subir foto de su pasaporte",
  chooseFile: "Elegir Archivo",

  paymentMethod: "Método de Pago *",
  paymentMethodPlaceholder: "Seleccionar método de pago preferido",
  cash: "Efectivo",
  card: "Tarjeta de Crédito/Débito",
  onlineTransfer: "Transferencia Online",
  paymentNote: "El pago se cobrará en recepción al llegar",

  completeCheckInBtn: "Completar Registro",
  completingCheckIn: "Completando Registro...",
  editInfo: "Editar Mi Información",

  goodDay: "¡Buen día, Nuestro Honorable Huésped!",
  welcomeHostel: "Bienvenido a Pelangi Capsule Hostel",
  address: "Dirección:",
  hostelPhotos: "📸 Fotos del Hostel",
  googleMaps: "📍 Google Maps",
  checkInVideo: "🎥 Video de Registro",
  checkInTime: "Registro: Desde las 3:00 PM",
  checkOutTime: "Salida: Antes de las 12:00 PM",
  doorPassword: "Contraseña de la Puerta:",
  capsuleNumber: "Su Número de Cápsula:",
  accessCard: "Tarjeta de Acceso a Cápsula: Colocada en su almohada",
  importantReminders: "Recordatorios Importantes:",
  noCardWarning: "🚫 No deje su tarjeta dentro de la cápsula y cierre la puerta",
  noSmoking: "🚭 No Fumar en el área del hostel",
  cctvWarning: "🎥 Monitoreado por CCTV – Violación (ej: fumar) puede resultar en multa de RM300",
  infoEditable: "Información Editable",
  editUntil: "Puede editar su información de registro hasta",
  editMyInfo: "Editar Mi Información",
  assistance: "Para cualquier asistencia, por favor contacte recepción.",
  enjoyStay: "¡Disfrute su estadía en Pelangi Capsule Hostel! 💼🌟",

  validatingLink: "Validando enlace de registro...",
  invalidLink: "Enlace Inválido",
  invalidLinkDesc: "Este enlace de registro es inválido o le falta un token.",
  expiredLink: "Enlace Inválido o Expirado",
  expiredLinkDesc: "Este enlace de registro es inválido o ha expirado.",
  error: "Error",
  validationError: "Falló la validación del enlace de registro.",
  checkInFailed: "Registro Fallido",
  checkInSuccess: "¡Registro Exitoso!",
  checkInSuccessDesc: "¡Bienvenido a Pelangi Capsule Hostel! Ha sido asignado a",

  selectLanguage: "Seleccionar Idioma",
  currentLanguage: "Español"
};

// Japanese translations
const jaTranslations: Translations = {
  welcomeTitle: "ペランギカプセルホステルへようこそ",
  completeCheckIn: "チェックイン情報を完了してください",
  assignedCapsule: "割り当てられたカプセル",
  prefilledInfo: "事前入力情報:",

  personalInfo: "個人情報",
  fullNameLabel: "身分証明書/パスポート記載の氏名 *",
  fullNamePlaceholder: "IDに記載されている氏名を入力してください",
  contactNumberLabel: "連絡先番号 *",
  contactNumberPlaceholder: "連絡先番号を入力してください (例: +60123456789)",
  genderLabel: "性別 *",
  genderPlaceholder: "性別を選択",
  male: "男性",
  female: "女性",
  nationalityLabel: "国籍 *",
  nationalityPlaceholder: "例: マレーシア、シンガポール",

  identityDocs: "身分証明書 *",
  identityDocsDesc: "IDまたはパスポート情報と書類の写真を提供してください:",
  icNumberLabel: "ID番号 (マレーシア人用)",
  icNumberPlaceholder: "例: 950101-01-1234",
  passportNumberLabel: "パスポート番号 (外国人用)",
  passportNumberPlaceholder: "例: A12345678",
  icPhotoLabel: "ID書類写真",
  icPhotoDesc: "IDの写真をアップロード",
  passportPhotoLabel: "パスポート書類写真",
  passportPhotoDesc: "パスポートの写真をアップロード",
  chooseFile: "ファイルを選択",

  paymentMethod: "支払い方法 *",
  paymentMethodPlaceholder: "希望する支払い方法を選択",
  cash: "現金",
  card: "クレジット/デビットカード",
  onlineTransfer: "オンライン振込",
  paymentNote: "到着時にフロントデスクで支払いを徴収します",

  completeCheckInBtn: "チェックイン完了",
  completingCheckIn: "チェックインを完了中...",
  editInfo: "情報を編集",

  goodDay: "こんにちは、私たちの大切なお客様！",
  welcomeHostel: "ペランギカプセルホステルへようこそ",
  address: "住所:",
  hostelPhotos: "📸 ホステル写真",
  googleMaps: "📍 グーグルマップ",
  checkInVideo: "🎥 チェックインビデオ",
  checkInTime: "チェックイン: 午後3:00から",
  checkOutTime: "チェックアウト: 午後12:00まで",
  doorPassword: "ドアパスワード:",
  capsuleNumber: "あなたのカプセル番号:",
  accessCard: "カプセルアクセスカード: 枕の上に置いてあります",
  importantReminders: "重要な注意事項:",
  noCardWarning: "🚫 カードをカプセル内に置いたままドアを閉めないでください",
  noSmoking: "🚭 ホステルエリア内禁煙",
  cctvWarning: "🎥 CCTV監視中 – 違反行為(喫煙など)はRM300の罰金が科される場合があります",
  infoEditable: "情報編集可能",
  editUntil: "チェックイン情報は次の時間まで編集できます",
  editMyInfo: "情報を編集",
  assistance: "ご不明な点がございましたら、フロントまでお問い合わせください。",
  enjoyStay: "ペランギカプセルホステルでのご滞在をお楽しみください！💼🌟",

  validatingLink: "チェックインリンクを検証中...",
  invalidLink: "無効なリンク",
  invalidLinkDesc: "このチェックインリンクは無効またはトークンが不足しています。",
  expiredLink: "無効または期限切れのリンク",
  expiredLinkDesc: "このチェックインリンクは無効または期限切れです。",
  error: "エラー",
  validationError: "チェックインリンクの検証に失敗しました。",
  checkInFailed: "チェックイン失敗",
  checkInSuccess: "チェックイン成功！",
  checkInSuccessDesc: "ペランギカプセルホステルへようこそ！",

  selectLanguage: "言語を選択",
  currentLanguage: "日本語"
};

// Korean translations
const koTranslations: Translations = {
  welcomeTitle: "펠랑이 캡슐 호스텔에 오신 것을 환영합니다",
  completeCheckIn: "체크인 정보를 완료해주세요",
  assignedCapsule: "배정된 캡슐",
  prefilledInfo: "미리 입력된 정보:",

  personalInfo: "개인정보",
  fullNameLabel: "신분증/여권상 실명 *",
  fullNamePlaceholder: "신분증에 기재된 이름을 입력하세요",
  contactNumberLabel: "연락처 *",
  contactNumberPlaceholder: "연락처를 입력하세요 (예: +60123456789)",
  genderLabel: "성별 *",
  genderPlaceholder: "성별 선택",
  male: "남성",
  female: "여성",
  nationalityLabel: "국적 *",
  nationalityPlaceholder: "예: 말레이시아, 싱가포르",

  identityDocs: "신분증명서 *",
  identityDocsDesc: "신분증 또는 여권 정보와 서류 사진을 제공해주세요:",
  icNumberLabel: "신분증 번호 (말레이시아인용)",
  icNumberPlaceholder: "예: 950101-01-1234",
  passportNumberLabel: "여권번호 (외국인용)",
  passportNumberPlaceholder: "예: A12345678",
  icPhotoLabel: "신분증 서류 사진",
  icPhotoDesc: "신분증 사진 업로드",
  passportPhotoLabel: "여권 서류 사진",
  passportPhotoDesc: "여권 사진 업로드",
  chooseFile: "파일 선택",

  paymentMethod: "결제 방법 *",
  paymentMethodPlaceholder: "선호하는 결제 방법 선택",
  cash: "현금",
  card: "신용/직불카드",
  onlineTransfer: "온라인 이체",
  paymentNote: "도착시 프런트 데스크에서 결제를 수납합니다",

  completeCheckInBtn: "체크인 완료",
  completingCheckIn: "체크인 완료 중...",
  editInfo: "내 정보 편집",

  goodDay: "안녕하세요, 소중한 고객님!",
  welcomeHostel: "펠랑이 캡슐 호스텔에 오신 것을 환영합니다",
  address: "주소:",
  hostelPhotos: "📸 호스텔 사진",
  googleMaps: "📍 구글 지도",
  checkInVideo: "🎥 체크인 비디오",
  checkInTime: "체크인: 오후 3:00부터",
  checkOutTime: "체크아웃: 오후 12:00까지",
  doorPassword: "문 비밀번호:",
  capsuleNumber: "귀하의 캡슐 번호:",
  accessCard: "캡슐 출입 카드: 베개 위에 놓여있습니다",
  importantReminders: "중요 알림사항:",
  noCardWarning: "🚫 카드를 캡슐 안에 두고 문을 닫지 마세요",
  noSmoking: "🚭 호스텔 내 금연",
  cctvWarning: "🎥 CCTV 감시 중 – 위반 행위(흡연 등)시 RM300 벌금이 부과될 수 있습니다",
  infoEditable: "정보 편집 가능",
  editUntil: "다음 시간까지 체크인 정보를 편집할 수 있습니다",
  editMyInfo: "내 정보 편집",
  assistance: "도움이 필요하시면 리셉션에 문의해 주세요.",
  enjoyStay: "펠랑이 캡슐 호스텔에서의 숙박을 즐기세요! 💼🌟",

  validatingLink: "체크인 링크 검증 중...",
  invalidLink: "잘못된 링크",
  invalidLinkDesc: "이 체크인 링크가 유효하지 않거나 토큰이 누락되었습니다.",
  expiredLink: "잘못되었거나 만료된 링크",
  expiredLinkDesc: "이 체크인 링크가 유효하지 않거나 만료되었습니다.",
  error: "오류",
  validationError: "체크인 링크 검증에 실패했습니다.",
  checkInFailed: "체크인 실패",
  checkInSuccess: "체크인 성공!",
  checkInSuccessDesc: "펠랑이 캡슐 호스텔에 오신 것을 환영합니다!",

  selectLanguage: "언어 선택",
  currentLanguage: "한국어"
};

// Translation dictionary
const translations: Record<Language, Translations> = {
  en: enTranslations,
  ms: msTranslations,
  'zh-cn': zhTranslations,
  es: esTranslations,
  ja: jaTranslations,
  ko: koTranslations
};

// I18n context
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

export const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: enTranslations
});

// I18n hook
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// I18n Provider component props
interface I18nProviderProps {
  children: ReactNode;
}

// I18n Provider component factory function  
export const createI18nProvider = () => {
  return React.memo(({ children }: I18nProviderProps) => {
    const [language, setLanguageState] = useState<Language>(() => {
      // Get language from localStorage or default to English
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('hostel-language');
        if (stored && Object.keys(SUPPORTED_LANGUAGES).includes(stored)) {
          return stored as Language;
        }
      }
      return 'en';
    });

    const setLanguage = (lang: Language) => {
      setLanguageState(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hostel-language', lang);
      }
    };

    const t = translations[language];

    return React.createElement(
      I18nContext.Provider, 
      { value: { language, setLanguage, t } }, 
      children
    );
  });
};

// Export translation function for direct usage
export const getTranslations = (lang: Language): Translations => {
  return translations[lang] || translations.en;
};