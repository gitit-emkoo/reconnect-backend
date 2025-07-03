import { Test, TestingModule } from '@nestjs/testing';
import { AgreementController } from './agreement.controller';
import { AgreementService } from './agreement.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { SignAgreementDto } from './dto/sign-agreement.dto';
import { UpdateAgreementStatusDto } from './dto/update-agreement-status.dto';

describe('AgreementController', () => {
  let controller: AgreementController;
  let service: AgreementService;

  const mockAgreementService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    signAgreement: jest.fn(),
    updateStatus: jest.fn(),
    findByUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgreementController],
      providers: [
        {
          provide: AgreementService,
          useValue: mockAgreementService,
        },
      ],
    }).compile();

    controller = module.get<AgreementController>(AgreementController);
    service = module.get<AgreementService>(AgreementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new agreement', async () => {
      const createAgreementDto: CreateAgreementDto = {
        title: '테스트 합의서',
        content: '테스트 내용',
        condition: '테스트 조건',
        authorId: 'author-id',
        partnerId: 'partner-id',
        authorSignature: 'base64-signature-data',
        coupleId: 'couple-id',
      };

      const mockRequest = {
        user: { id: 'author-id' },
      };

      const expectedAgreement = {
        id: 'agreement-id',
        ...createAgreementDto,
        authorId: 'author-id',
        status: 'pending',
        author: { id: 'author-id', nickname: '작성자', email: 'author@test.com' },
        partner: { id: 'partner-id', nickname: '파트너', email: 'partner@test.com' },
      };

      mockAgreementService.create.mockResolvedValue(expectedAgreement);

      const result = await controller.create(createAgreementDto, mockRequest as any);

      expect(service.create).toHaveBeenCalledWith({
        ...createAgreementDto,
        authorId: 'author-id',
      });
      expect(result).toEqual(expectedAgreement);
    });
  });

  describe('findAll', () => {
    it('should return all agreements', async () => {
      const expectedAgreements = [
        {
          id: 'agreement-1',
          title: '합의서 1',
          content: '내용 1',
          condition: '조건 1',
          authorId: 'author-1',
          partnerId: 'partner-1',
          status: 'pending',
          author: { id: 'author-1', nickname: '작성자1', email: 'author1@test.com' },
          partner: { id: 'partner-1', nickname: '파트너1', email: 'partner1@test.com' },
        },
      ];

      mockAgreementService.findAll.mockResolvedValue(expectedAgreements);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedAgreements);
    });
  });

  describe('findMyAgreements', () => {
    it('should return agreements for the authenticated user', async () => {
      const mockRequest = {
        user: { id: 'user-id' },
      };

      const expectedAgreements = [
        {
          id: 'agreement-1',
          title: '내 합의서 1',
          content: '내용 1',
          condition: '조건 1',
          authorId: 'user-id',
          partnerId: 'partner-1',
          status: 'pending',
          author: { id: 'user-id', nickname: '사용자', email: 'user@test.com' },
          partner: { id: 'partner-1', nickname: '파트너1', email: 'partner1@test.com' },
        },
      ];

      mockAgreementService.findByUser.mockResolvedValue(expectedAgreements);

      const result = await controller.findMyAgreements(mockRequest as any);

      expect(service.findByUser).toHaveBeenCalledWith('user-id');
      expect(result).toEqual(expectedAgreements);
    });
  });

  describe('findOne', () => {
    it('should return an agreement by id', async () => {
      const agreementId = 'agreement-id';
      const expectedAgreement = {
        id: agreementId,
        title: '테스트 합의서',
        content: '테스트 내용',
        condition: '테스트 조건',
        authorId: 'author-id',
        partnerId: 'partner-id',
        status: 'pending',
        author: { id: 'author-id', nickname: '작성자', email: 'author@test.com' },
        partner: { id: 'partner-id', nickname: '파트너', email: 'partner@test.com' },
      };

      mockAgreementService.findOne.mockResolvedValue(expectedAgreement);

      const result = await controller.findOne(agreementId);

      expect(service.findOne).toHaveBeenCalledWith(agreementId);
      expect(result).toEqual(expectedAgreement);
    });
  });

  describe('signAgreement', () => {
    it('should sign an agreement', async () => {
      const agreementId = 'agreement-id';
      const signAgreementDto: SignAgreementDto = {
        signature: 'base64-signature-data',
        signedAt: '2024-01-01T00:00:00Z',
      };

      const mockRequest = {
        user: { id: 'author-id' },
      };

      const expectedAgreement = {
        id: agreementId,
        title: '테스트 합의서',
        content: '테스트 내용',
        condition: '테스트 조건',
        authorId: 'author-id',
        partnerId: 'partner-id',
        status: 'signed',
        authorSignature: 'base64-signature-data',
        author: { id: 'author-id', nickname: '작성자', email: 'author@test.com' },
        partner: { id: 'partner-id', nickname: '파트너', email: 'partner@test.com' },
      };

      mockAgreementService.signAgreement.mockResolvedValue(expectedAgreement);

      const result = await controller.signAgreement(agreementId, signAgreementDto, mockRequest as any);

      expect(service.signAgreement).toHaveBeenCalledWith(agreementId, 'author-id', signAgreementDto);
      expect(result).toEqual(expectedAgreement);
    });
  });

  describe('updateStatus', () => {
    it('should update agreement status', async () => {
      const agreementId = 'agreement-id';
      const updateStatusDto: UpdateAgreementStatusDto = {
        status: 'completed',
      };

      const mockRequest = {
        user: { id: 'author-id' },
      };

      const expectedAgreement = {
        id: agreementId,
        title: '테스트 합의서',
        content: '테스트 내용',
        condition: '테스트 조건',
        authorId: 'author-id',
        partnerId: 'partner-id',
        status: 'completed',
        author: { id: 'author-id', nickname: '작성자', email: 'author@test.com' },
        partner: { id: 'partner-id', nickname: '파트너', email: 'partner@test.com' },
      };

      mockAgreementService.updateStatus.mockResolvedValue(expectedAgreement);

      const result = await controller.updateStatus(agreementId, updateStatusDto, mockRequest as any);

      expect(service.updateStatus).toHaveBeenCalledWith(agreementId, 'author-id', updateStatusDto);
      expect(result).toEqual(expectedAgreement);
    });
  });
}); 