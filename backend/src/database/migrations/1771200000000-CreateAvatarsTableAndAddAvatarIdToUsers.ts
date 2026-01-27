import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAvatarsTableAndAddAvatarIdToUsers1771200000000 implements MigrationInterface {
    name = 'CreateAvatarsTableAndAddAvatarIdToUsers1771200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Avatars tablosunu oluştur
        await queryRunner.query(`
            CREATE TABLE "avatars" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(200) NOT NULL,
                "image_url" text NOT NULL,
                "video_url" text,
                "description" text,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_avatars" PRIMARY KEY ("id")
            )
        `);

        // Index ekle
        await queryRunner.query(`
            CREATE INDEX "IDX_avatars_is_active" ON "avatars" ("is_active")
        `);

        // Users tablosuna avatar_id kolonu ekle
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "avatar_id" uuid
        `);

        // Foreign key constraint ekle (opsiyonel - eğer avatar silinirse null yap)
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "FK_users_avatar_id" 
            FOREIGN KEY ("avatar_id") 
            REFERENCES "avatars"("id") 
            ON DELETE SET NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Foreign key constraint'i kaldır
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP CONSTRAINT IF EXISTS "FK_users_avatar_id"
        `);

        // avatar_id kolonunu kaldır
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "avatar_id"
        `);

        // Index'i kaldır
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_avatars_is_active"
        `);

        // Avatars tablosunu sil
        await queryRunner.query(`
            DROP TABLE IF EXISTS "avatars"
        `);
    }
}
