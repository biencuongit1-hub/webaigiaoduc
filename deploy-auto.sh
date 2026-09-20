#!/bin/bash
# Script tự động build và deploy lên Firebase Hosting trong 1 lệnh duy nhất
set -e

echo "🚀 [1/3] Đang đóng gói ứng dụng (npm run build)..."
npm run build

echo "✨ [2/3] Kiểm tra Firebase CLI..."
if ! command -v firebase &> /dev/null
then
    echo "⚠️  Firebase CLI chưa được cài đặt. Đang cài đặt..."
    npm install -g firebase-tools
fi

echo "🌐 [3/3] Đang triển khai tự động lên Firebase Hosting..."
firebase deploy --only hosting

echo "✅ HOÀN TẤT! Ứng dụng Giáo viên thời đại AI đã được triển khai thành công lên Firebase Hosting!"
