# ใช้ node image
FROM node:20.12.2

# ตั้งค่า working directory
WORKDIR /app

# คัดลอกไฟล์สำคัญ
COPY package.json package-lock.json ./
RUN npm install

COPY . .

ENV GOOGLE_APPLICATION_CREDENTIALS="/tmp/key.json"

# สร้าง Prisma Client
RUN npx prisma generate

# ใช้ Migrations
# RUN npx prisma migrate deploy

# Build TypeScript ก่อน
RUN npx tsc

# เริ่มเซิร์ฟเวอร์
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
