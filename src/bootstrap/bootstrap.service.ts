import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initializeOrganization();
  }

  private async initializeOrganization() {
    try {
      // Get config from .env
      const orgName = this.config.get('ORG_NAME');
      const orgDescription = this.config.get('ORG_DESCRIPTION');
      const adminEmail = this.config.get('SUPER_ADMIN_EMAIL');
      const adminPassword = this.config.get('SUPER_ADMIN_PASSWORD');
      const adminName = this.config.get('SUPER_ADMIN_NAME') || 'Super Admin';

      if (!orgName || !adminEmail || !adminPassword) {
        this.logger.warn(
          '⚠️  Organization or Super Admin credentials not set in .env',
        );
        return;
      }

      // Check if organization already exists
      const existingOrg = await this.prisma.organization.findFirst();

      if (existingOrg) {
        this.logger.log('✅ Organization already initialized');
        // Still check and initialize configurables if missing
        await this.initializeConfigurables(existingOrg.id);
        return;
      }

      // Create organization and super admin in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create organization
        const org = await tx.organization.create({
          data: {
            name: orgName,
            description: orgDescription,
          },
        });

        this.logger.log(`✅ Organization created: ${org.name}`);

        // Create super admin
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const superAdmin = await tx.user.create({
          data: {
            email: adminEmail,
            name: adminName,
            password: hashedPassword,
            role: 'super_admin',
            status: 'active',
            organizationId: org.id,
          },
        });

        this.logger.log(`✅ Super admin created: ${superAdmin.email}`);

        return { org, superAdmin };
      });

      this.logger.log('🎉 Organization initialization complete!');

      // Initialize configurables after organization is created
      await this.initializeConfigurables(result.org.id);
    } catch (error) {
      this.logger.error('❌ Failed to initialize organization:', error.message);
    }
  }

  private async initializeConfigurables(organizationId: number) {
    try {
      // Check if configurables already exist for this organization
      const existingFields = await this.prisma.configurableField.findFirst({
        where: { organizationId },
      });

      if (existingFields) {
        this.logger.log('✅ Configurables already initialized');
        return;
      }

      const defaultFields = [
        {
          entityType: 'person',
          fieldName: 'status',
          label: 'Person Status',
          options: [
            { value: 'Lead', label: 'Lead' },
            { value: 'Follow Up', label: 'Follow Up' },
            { value: 'Hot Lead', label: 'Hot Lead' },
            { value: 'Client', label: 'Client' },
            { value: 'Inactive', label: 'Inactive' },
          ],
        },
        {
          entityType: 'company',
          fieldName: 'status',
          label: 'Company Status',
          options: [
            { value: 'Prospect', label: 'Prospect' },
            { value: 'Active', label: 'Active' },
            { value: 'Partner', label: 'Partner' },
            { value: 'Churned', label: 'Churned' },
          ],
        },
        {
          entityType: 'event',
          fieldName: 'status',
          label: 'Event Status',
          options: [
            { value: 'Scheduled', label: 'Scheduled' },
            { value: 'Postponed', label: 'Postponed' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Cancelled', label: 'Cancelled' },
            { value: 'Not Attended', label: 'Not Attended' },
          ],
        },
      ];

      for (const fieldData of defaultFields) {
        const field = await this.prisma.configurableField.create({
          data: {
            organizationId,
            entityType: fieldData.entityType,
            fieldName: fieldData.fieldName,
            label: fieldData.label,
          },
        });

        await this.prisma.configurableOption.createMany({
          data: fieldData.options.map((opt) => ({
            fieldId: field.id,
            value: opt.value,
            label: opt.label,
          })),
        });
      }

      this.logger.log(
        `✅ Initialized configurables for organization ${organizationId}`,
      );
    } catch (error) {
      this.logger.error(
        '❌ Failed to initialize configurables:',
        error.message,
      );
    }
  }
}
