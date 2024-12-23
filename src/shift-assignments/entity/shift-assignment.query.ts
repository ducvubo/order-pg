import { ConfigService } from '@nestjs/config'
import { getOpenSearch } from 'src/config/open-search.config'

export class ShiftAssignmentQuery {
  private readonly openSearch = getOpenSearch().instanceConnect
  constructor(private readonly configService: ConfigService) {}
}
