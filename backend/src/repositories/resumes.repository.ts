import prisma from '../lib/prisma';

export class ResumesRepository {
  async create(
    candidateProfileId: string,
    title: string,
    file: { fileUrl: string; fileName: string; mimeType: string; size: number; storagePath: string },
    isDefault: boolean = false,
  ) {
    return prisma.resume.create({
      data: {
        title,
        candidateProfileId,
        isDefault,
        versions: {
          create: {
            fileUrl: file.fileUrl,
            fileName: file.fileName,
            mimeType: file.mimeType,
            size: file.size,
            storagePath: file.storagePath,
            versionNumber: 1,
          },
        },
      },
      include: {
        versions: true,
      },
    });
  }

  async addVersion(
    resumeId: string,
    file: {
      fileUrl: string;
      fileName: string;
      mimeType: string;
      size: number;
      storagePath: string;
      versionNumber: number;
    },
  ) {
    return prisma.resumeVersion.create({
      data: {
        resumeId,
        fileUrl: file.fileUrl,
        fileName: file.fileName,
        mimeType: file.mimeType,
        size: file.size,
        storagePath: file.storagePath,
        versionNumber: file.versionNumber,
      },
      include: {
        resume: true,
      },
    });
  }

  async update(id: string, data: { title?: string; isDefault?: boolean }) {
    return prisma.resume.update({
      where: { id },
      data,
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.resume.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findById(id: string) {
    return prisma.resume.findFirst({
      where: { id, deletedAt: null },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            analysis: true,
          },
        },
      },
    });
  }

  async findVersionById(versionId: string) {
    return prisma.resumeVersion.findFirst({
      where: { id: versionId, deletedAt: null },
      include: {
        resume: true,
        analysis: true,
      },
    });
  }

  async findAll(candidateProfileId: string) {
    return prisma.resume.findMany({
      where: { candidateProfileId, deletedAt: null },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            analysis: true,
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async findDefault(candidateProfileId: string) {
    return prisma.resume.findFirst({
      where: { candidateProfileId, isDefault: true, deletedAt: null },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    });
  }

  async clearDefaults(candidateProfileId: string, excludeResumeId: string) {
    return prisma.resume.updateMany({
      where: {
        candidateProfileId,
        id: { not: excludeResumeId },
        deletedAt: null,
      },
      data: { isDefault: false },
    });
  }
}

export const resumesRepository = new ResumesRepository();
export default resumesRepository;
