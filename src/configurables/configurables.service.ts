import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ConfigurablesService {
  private readonly logger = new Logger(ConfigurablesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getConfigurableFields(
    organizationId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    // Fetch all configurable fields with options
    const fields = await this.prisma.configurableField.findMany({
      where: { organizationId },
      include: {
        options: {
          where: { isActive: true },
        },
      },
    });

    // Flatten all options for pagination
    const allOptions = fields.flatMap((field) =>
      field.options.map((option) => ({
        id: option.id,
        value: option.value,
        label: option.label,
        isActive: option.isActive,
        entityType: field.entityType,
        fieldName: field.fieldName,
        entityLabel: field.label,
        fieldId: field.id,
      })),
    );

    // Apply search filter
    let filteredOptions = allOptions;
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filteredOptions = allOptions.filter(
        (option) =>
          option.label.toLowerCase().includes(searchLower) ||
          option.value.toLowerCase().includes(searchLower) ||
          option.entityType.toLowerCase().includes(searchLower) ||
          option.fieldName.toLowerCase().includes(searchLower),
      );
    }

    // Apply pagination
    const total = filteredOptions.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedOptions = filteredOptions.slice(skip, skip + limit);

    return {
      options: paginatedOptions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getConfigurableOptions(
    organizationId: number,
    entityType: string,
    fieldName: string,
  ) {
    const field = await this.prisma.configurableField.findUnique({
      where: {
        organizationId_entityType_fieldName: {
          organizationId,
          entityType,
          fieldName,
        },
      },
      include: {
        options: {
          where: { isActive: true },
        },
      },
    });

    if (!field) {
      throw new NotFoundException(
        `Field ${fieldName} not found for ${entityType}`,
      );
    }

    return field.options;
  }

  async initializeDefaultFields(organizationId: number) {
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
      `✅ Initialized default fields for organization ${organizationId}`,
    );
  }

  async addOption(
    organizationId: number,
    entityType: string,
    fieldName: string,
    value: string,
    label: string,
  ) {
    const field = await this.prisma.configurableField.findUnique({
      where: {
        organizationId_entityType_fieldName: {
          organizationId,
          entityType,
          fieldName,
        },
      },
    });

    if (!field) {
      throw new NotFoundException(`Field ${fieldName} not found`);
    }

    return this.prisma.configurableOption.create({
      data: {
        fieldId: field.id,
        value,
        label,
        isActive: true,
      },
    });
  }

  async updateOption(optionId: number, label: string, isActive: boolean) {
    return this.prisma.configurableOption.update({
      where: { id: optionId },
      data: { label, isActive },
    });
  }

  async deleteOption(optionId: number) {
    return this.prisma.configurableOption.update({
      where: { id: optionId },
      data: { isActive: false },
    });
  }
}
