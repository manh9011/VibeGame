# IOE WebAPP - Thi Thử IOE

Ứng dụng web luyện thi IOE (Internet Olympiad of English) được xây dựng với Vue 3, TypeScript và Tailwind CSS. Ứng dụng cung cấp môi trường thi thử sinh động, cho phép quản lý ngân hàng câu hỏi và cấu hình linh hoạt.

## 🚀 Tính Năng Chính

- **Thi Thử Đa Dạng**: Hỗ trợ mô phỏng bài thi với các dạng câu hỏi phong phú.
- **Tùy Chỉnh Linh Hoạt**:
  - Chọn khối lớp (Lớp 1 - Lớp 12).
  - Chọn độ khó: Dễ (Easy), Vừa (Medium), Khó (Hard).
- **Hệ Thống Admin Mạnh Mẽ**:
  - **Dashboard**: Tổng quan hệ thống.
  - **Quản lý câu hỏi**: Thêm, sửa, xóa, xem danh sách câu hỏi.
  - **Cấu hình**: Cài đặt kết nối database (Upstash Redis) và các tham số game.
  - **Lịch sử**: Xem lại lịch sử các bài thi.
- **Lưu Trữ Đám Mây**: Tích hợp Upstash Redis giúp đồng bộ dữ liệu câu hỏi và cấu hình mọi lúc mọi nơi.
- **Giao Diện Hiện Đại**: Thiết kế responsive, đẹp mắt với Tailwind CSS và các hiệu ứng sinh động.

## 🛠️ Cài Đặt và Sử Dụng

### Yêu Cầu
- Node.js (phiên bản mới nhất được khuyến nghị)
- npm hoặc yarn

### Các Bước Cài Đặt

1.  **Clone dự án về máy:**
    ```bash
    git clone <repository-url>
    cd IOE-WebAPP
    ```

2.  **Cài đặt các gói thư viện (dependencies):**
    ```bash
    npm install
    ```

3.  **Chạy ứng dụng (Môi trường Development):**
    ```bash
    npm run dev
    ```
    Truy cập vào địa chỉ được cung cấp (thường là `http://localhost:5173`).

4.  **Đóng gói (Build for Production):**
    ```bash
    npm run build
    ```
    Kết quả build sẽ nằm trong thư mục `dist`.

5.  **Xem trước bản build (Preview):**
    ```bash
    npm run preview
    ```

## 📚 Công Nghệ Sử Dụng

- **Core**: [Vue 3](https://vuejs.org/) (Composition API), [TypeScript](https://www.typescriptlang.org/).
- **Build Tool**: [Vite](https://vitejs.dev/).
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), FontAwesome (cho icons).
- **Routing**: [Vue Router](https://router.vuejs.org/).
- **State Management**: Vue Composables (`useQuestions`, `useGameState`...).
- **Database**: [Upstash Redis](https://upstash.com/) (Serverless Redis).

## 📂 Cấu Trúc Thư Mục Cơ Bản

```
src/
├── components/      # Các thành phần giao diện tái sử dụng (GlobalModal, etc.)
├── modules/         # Logic xử lý (Composables) cho Game, Admin, Questions
├── router/          # Cấu hình Routing
├── views/           # Các màn hình chính (Intro, Game, Result, Admin...)
│   └── admin/       # Các màn hình con của trang Admin
├── App.vue          # Component gốc
└── main.ts          # Entry point
```

## 📝 Lưu Ý

- Ứng dụng yêu cầu **Upstash Redis REST Token** để tải và lưu dữ liệu. Khi chạy lần đầu, bạn sẽ được yêu cầu nhập token này (hoặc cấu hình trong trang Admin).

---
© 2026 VibeGame Team.
