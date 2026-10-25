import { prisma } from "../config/prisma.js";
export const findNeonUser = async (filter) => {
    try {
        if (filter.id) {
            const rows = await prisma.$queryRaw `
                SELECT id, name, email, role, "createdAt"
                FROM neon_auth."user"
                WHERE id::text = ${filter.id}
                LIMIT 1
            `;
            return rows[0] ?? null;
        }
        if (filter.email) {
            const normalizedEmail = filter.email.trim().toLowerCase();
            const rows = await prisma.$queryRaw `
                SELECT id, name, email, role, "createdAt"
                FROM neon_auth."user"
                WHERE LOWER(email) = ${normalizedEmail}
                LIMIT 1
            `;
            return rows[0] ?? null;
        }
        return null;
    }
    catch (error) {
        console.error("Error finding Neon user:", error);
        throw error;
    }
};
export const updateNeonUserRole = async (userId, role) => {
    try {
        await prisma.$executeRaw `
            UPDATE neon_auth.user
            SET role = ${role}, "updatedAt" = NOW()
            WHERE id = ${userId}::uuid AND (role IS NULL OR role != 'admin')
        `;
    }
    catch (e) {
        console.error(e);
    }
};
export const findNeonUsersByIds = async (ids) => {
    if (!ids || ids.length === 0)
        return {};
    try {
        const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
        const rows = await prisma.$queryRaw `
        SELECT id, name, email, role, "createdAt" as "createdAt"
        FROM neon_auth.user
        WHERE id::text = ANY(${uniqueIds})
        `;
        const map = {};
        for (const row of rows) {
            map[row.id] = row;
        }
        return map;
    }
    catch (error) {
        console.error(error);
        return {};
    }
};
export const findNeonMerchants = async () => {
    try {
        return await prisma.$queryRaw `
                SELECT id, name, email, role, "createdAt" as "createdAt"
                FROM neon_auth.user
                WHERE role = 'merchant'
                ORDER BY "createdAt" DESC`;
    }
    catch (e) {
        console.error(e);
        return [];
    }
};
export const countNeonMerchants = async () => {
    try {
        const rows = await prisma.$queryRaw `
        SELECT COUNT(*) as count
        FROM neon_auth.user
        WHERE role = 'merchant'
        `;
        return Number(rows[0]?.count || 0);
    }
    catch (e) {
        console.error(e);
        return 0;
    }
};
