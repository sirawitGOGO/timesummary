# ใช้ node image
FROM node:20.12.2

# ตั้งค่า working directory
WORKDIR /app

# คัดลอกไฟล์สำคัญ
COPY package.json package-lock.json ./
RUN npm install

COPY . .

# สร้าง Prisma Client
RUN npx prisma generate

# ใช้ Migrations
RUN npx prisma migrate deploy

# เริ่มเซิร์ฟเวอร์
CMD ["npm", "run", "dev"]
