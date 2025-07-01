const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed Leave Types
    const leaveTypesData = [
      { name: 'Vacation Leave', maxDaysAllotted: 15, isDeductible: true },
      { name: 'Sick Leave', maxDaysAllotted: 7, isDeductible: true },
      { name: 'Emergency Leave', maxDaysAllotted: 3, isDeductible: true },
      { name: 'Maternity Leave', maxDaysAllotted: 60, isDeductible: false },
      { name: 'Paternity Leave', maxDaysAllotted: 7, isDeductible: false },
      { name: 'Special Leave', maxDaysAllotted: null, isDeductible: false }
    ];

    for (const leaveType of leaveTypesData) {
      await prisma.leavetypes.upsert({
        where: { name: leaveType.name },
        update: {},
        create: leaveType
      });
    }
    console.log('✅ Leave types seeded successfully!');

    // Seed Schools
    const schoolsData = [
      { name: 'DepEd Central Office' },
      { name: 'Sample Elementary School' },
      { name: 'Sample High School' },
      { name: 'Sample Senior High School' }
    ];

    for (const school of schoolsData) {
      await prisma.schools.upsert({
        where: { name: school.name },
        update: {},
        create: school
      });
    }
    console.log('✅ Schools seeded successfully!');

    // Seed Unit Groups
    const unitGroupsData = [
      { name: 'Human Resource' },
      { name: 'Finance' },
      { name: 'Curriculum' },
      { name: 'Planning' },
      { name: 'Legal' }
    ];

    for (const unitGroup of unitGroupsData) {
      await prisma.unitgroups.upsert({
        where: { name: unitGroup.name },
        update: {},
        create: unitGroup
      });
    }
    console.log('✅ Unit groups seeded successfully!');

    // Seed Units
    const hrGroup = await prisma.unitgroups.findFirst({ where: { name: 'Human Resource' } });
    const financeGroup = await prisma.unitgroups.findFirst({ where: { name: 'Finance' } });
    const curriculumGroup = await prisma.unitgroups.findFirst({ where: { name: 'Curriculum' } });

    if (hrGroup && financeGroup && curriculumGroup) {
      const unitsData = [
        { name: 'HR Management', head: true, unitGroupId: hrGroup.id },
        { name: 'Recruitment', head: false, unitGroupId: hrGroup.id },
        { name: 'Budget', head: true, unitGroupId: financeGroup.id },
        { name: 'Accounting', head: false, unitGroupId: financeGroup.id },
        { name: 'Elementary Education', head: true, unitGroupId: curriculumGroup.id },
        { name: 'Secondary Education', head: false, unitGroupId: curriculumGroup.id }
      ];

      for (const unit of unitsData) {
        await prisma.units.upsert({
          where: { name: unit.name },
          update: {},
          create: unit
        });
      }
      console.log('✅ Units seeded successfully!');
    }

    // Seed Roles
    const rolesData = [
      { name: 'Employee' },
      { name: 'Supervisor' },
      { name: 'Manager' },
      { name: 'HR' }
    ];

    for (const role of rolesData) {
      await prisma.roles.upsert({
        where: { name: role.name },
        update: {},
        create: role
      });
    }
    console.log('✅ Roles seeded successfully!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .then(async () => {
    console.log('🎉 Database seeding completed successfully!');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('💥 Database seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });