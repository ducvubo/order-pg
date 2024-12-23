import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToOpenSearch, deleteAllDocByOpenSearch, indexOpenSearchExists } from 'src/utils/open-search'
import { SHIFT_ASSIGNMENT_ELASTICHSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { OnModuleInit } from '@nestjs/common'
import { ShiftAssignmentEntity } from './shift-assignments.entity'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'

export class ShiftAssignmentRepo implements OnModuleInit {
  constructor(
    @InjectRepository(ShiftAssignmentEntity)
    private readonly shiftAssignmentRepository: Repository<ShiftAssignmentEntity>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: ShiftAssignmentEntity[] = await this.shiftAssignmentRepository.find()
    const indexExist = await indexOpenSearchExists(SHIFT_ASSIGNMENT_ELASTICHSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByOpenSearch(SHIFT_ASSIGNMENT_ELASTICHSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToOpenSearch(SHIFT_ASSIGNMENT_ELASTICHSEARCH_INDEX, doc.sasm_id.toString(), doc)
    }
  }

  async createShiftAssignment(data: ShiftAssignmentEntity): Promise<ShiftAssignmentEntity> {
    try {
      return this.shiftAssignmentRepository.save(data)
    } catch (error) {
      saveLogSystem({
        action: 'createShiftAssignment',
        function: 'createShiftAssignment',
        class: 'ShiftAssignmentRepo',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
