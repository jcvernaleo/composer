/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, async, inject, fakeAsync, tick } from '@angular/core/testing';

import { IdCard, FileWallet } from 'composer-common';
import { IdentityCardStorageService } from './identity-card-storage.service';
import { ConnectionProfileService } from './connectionprofile.service';
import { IdentityService } from './identity.service';
import { WalletService } from './wallet.service';

import * as sinon from 'sinon';
let should = chai.should();

import { IdentityCardService } from './identity-card.service';

describe('IdentityCardService', () => {

    let mockIdentityCardStorageService;
    let mockConnectionProfileService;
    let mockIdentityService;
    let mockWalletService;

    beforeEach(() => {
        mockIdentityCardStorageService = sinon.createStubInstance(IdentityCardStorageService);
        mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
        mockIdentityService = sinon.createStubInstance(IdentityService);
        mockWalletService = sinon.createStubInstance(WalletService);

        TestBed.configureTestingModule({
            providers: [IdentityCardService,
                {provide: IdentityCardStorageService, useValue: mockIdentityCardStorageService},
                {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
                {provide: IdentityService, useValue: mockIdentityService},
                {provide: WalletService, useValue: mockWalletService}
            ]
        });
    });

    describe('#getIdentityCard', () => {
        it('should get the specified identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getName.returns('alice');
            let mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('test', mockIdCard);
            service['idCards'] = mockCardMap;

            service.getIdentityCard('test').getName().should.equal('alice');
        })));

        it('should not get an identity card if it does not exist', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            should.not.exist(service.getIdentityCard('test'));
        })));
    });

    describe('#getCurrentIdentityCard', () => {
        it('should get the current identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getName.returns('alice');
            let mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('test', mockIdCard);
            service['idCards'] = mockCardMap;
            service['currentCard'] = 'test';

            service.getCurrentIdentityCard().getName().should.equal('alice');
        })));

        it('should not get an identity card if there is no current identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            should.not.exist(service.getCurrentIdentityCard());
        })));
    });

    describe('#loadIdentityCards', () => {
        beforeEach(() => {
            mockIdentityCardStorageService.keys.returns(['uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd', 'uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd', 'uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd']);
            mockIdentityCardStorageService.get.withArgs('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').returns(JSON.parse('{"metadata":{"name":"NetworkAdmin","businessNetwork":"basic-sample-network","enrollmentId":"admin","enrollmentSecret":"adminpw"},"connectionProfile":{"name":"$default","type":"web"},"credentials":null}'));
            mockIdentityCardStorageService.get.withArgs('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').returns(JSON.parse('{"metadata":{"name":"Mr Penguin","businessNetwork":"basic-sample-network","enrollmentId":"admin","enrollmentSecret":"adminpw"},"connectionProfile":{"name":"$default","type":"web"},"credentials":null}'));
            mockIdentityCardStorageService.get.withArgs('uuid3xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').returns(JSON.parse('{"metadata":{"name":"Eric","businessNetwork":"basic-sample-network","enrollmentId":"admin","enrollmentSecret":"adminpw"},"connectionProfile":{"name":"$default","type":"web"},"credentials":null}'));
        });

        it('should load cards from local storage', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let result: number;
            service.loadIdentityCards().then((cardsLoaded) => {
                result = cardsLoaded;
            });

            tick();

            result.should.equal(3);
            service['idCards'].size.should.equal(3);
        })));

        it('should not load anything if there are no cards in local storage', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            mockIdentityCardStorageService.keys.returns([]);

            let result: number;
            service.loadIdentityCards().then((cardsLoaded) => {
                result = cardsLoaded;
            });

            tick();

            result.should.equal(0);
            mockIdentityCardStorageService.get.should.not.have.been.called;
        })));

        it('should throw error if card cannot be loaded', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            mockIdentityCardStorageService.keys.returns(['uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx']);
            mockIdentityCardStorageService.get.withArgs('lalalalalalalala');

            service.loadIdentityCards().then((cardsLoaded) => {
                throw Error('Card loaded without error');
            }).catch((reason) => {
                reason.should.be.an.instanceof(Error);
            });

            tick();
        })));

        it('should set the current card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            mockIdentityCardStorageService.get.withArgs('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd').returns(JSON.parse('{"current":true}'));

            service.loadIdentityCards();

            tick();

            service['currentCard'].should.equal('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
        })));
    });

    describe('#getIdentityCards', () => {
        it('should get identity cards', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let loadIdentityCardsSpy = sinon.spy(service, 'loadIdentityCards');
            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getName.returns('penguin');
            let mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('test', mockIdCard);
            service['idCards'] = mockCardMap;

            let result;
            service.getIdentityCards().then((idCards) => {
                result = idCards;
            });

            tick();

            result.size.should.equal(1);
            result.get('test').getName().should.equal('penguin');
            loadIdentityCardsSpy.should.not.have.been.called;
        })));

        it('should attempt to load identity cards if there are none', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let loadIdentityCardsSpy = sinon.spy(service, 'loadIdentityCards');
            mockIdentityCardStorageService.keys.returns([]);

            let result;
            service.getIdentityCards().then((idCards) => {
                result = idCards;
            });

            tick();

            result.size.should.equal(0);
            loadIdentityCardsSpy.should.have.been.called;
        })));
    });

    describe('#addInitialIdentityCards', () => {
        it('should create initial identity cards from array', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let mockIdCard1 = sinon.createStubInstance(IdCard);
            let mockIdCard2 = sinon.createStubInstance(IdCard);
            let initialCards = [mockIdCard1, mockIdCard2];
            let addIdentityCardSpy = sinon.spy(service, 'addIdentityCard');

            let cardRef: string;
            service.addInitialIdentityCards(initialCards).then((cardsCreated) => {
                cardRef = cardsCreated;
            });

            tick();

            addIdentityCardSpy.should.have.been.calledThrice;
            service['idCards'].get(cardRef).getName().should.equal('admin');
            service['idCards'].size.should.equal(3);
        })));

        it('should only add default identity card if initial card array is not specified', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let cardRef;
            service.addInitialIdentityCards().then((defaultCardRef) => {
                cardRef = defaultCardRef;
            });

            tick();

            service['idCards'].get(cardRef).getName().should.equal('admin');
            service['idCards'].get(cardRef).getConnectionProfile().name.should.equal('$default');
            service['idCards'].get(cardRef).getEnrollmentCredentials().id.should.equal('admin');
            service['idCards'].get(cardRef).getEnrollmentCredentials().secret.should.equal('adminpw');
        })));

        it('should not add inital identity cards if there are any identity cards already', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let mockIdCard = sinon.createStubInstance(IdCard);
            let mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('test', mockIdCard);
            service['idCards'] = mockCardMap;

            let result;
            service.addInitialIdentityCards().then((defaultCardRef) => {
                throw Error('Initial cards added without error');
            }, (reason) => {
                result = reason;
            });

            tick();

            result.message.should.equal('Initial cards loaded already');
            service['idCards'].size.should.equal(1);
        })));
    });

    describe('#createIdentityCard', () => {
        it('should create and store an identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let addIdentityCardSpy = sinon.spy(service, 'addIdentityCard');
            let connectionProfile = {
                name: 'hlfv1'
            };

            let result;
            service.createIdentityCard('bcc', 'cashless-network', 'admin', 'adminpw', connectionProfile).then((cardRef) => {
                result = cardRef;
            });

            tick();

            service['idCards'].size.should.equal(1);
            addIdentityCardSpy.should.have.been.called;
        })));
    });

    describe('#addIdentityCard', () => {
        it('should add an identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getName.returns('bcc');

            let result;
            service.addIdentityCard(mockIdCard).then((cardRef) => {
                result = cardRef;
            });

            tick();

            service['idCards'].size.should.equal(1);
            mockIdentityCardStorageService.set.should.have.been.calledTwice;
            mockIdentityCardStorageService.set.should.have.been.calledWith(result);
            mockIdentityCardStorageService.set.should.have.been.calledWith(result + '-pd', { unused: true });
        })));
    });

    describe('#deleteIdentityCard', () => {
        it('should delete an identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getName.returns('bcc');
            mockIdCard.getConnectionProfile.returns({
                name: 'hlfv1'
            });
            mockIdCard.getEnrollmentCredentials.returns({
                id: 'alice'
            });
            let mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('test', mockIdCard);
            service['idCards'] = mockCardMap;

            service.deleteIdentityCard('test');

            tick();

            service['idCards'].size.should.equal(0);
            mockWalletService.removeFromWallet.should.have.been.calledWith('test-hlfv1', 'alice');
            mockConnectionProfileService.deleteProfile.should.have.been.calledWith('test-hlfv1');
            mockIdentityCardStorageService.remove.should.have.been.calledWith('test');
            mockIdentityCardStorageService.remove.should.have.been.calledWith('test-pd');
        })));

        it('should not delete an identity card that does not exist', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {

            let result;
            service.deleteIdentityCard('test').then(() => {
                throw Error('Identity card deleted without error');
            }, (reason) => {
                result = reason;
            });

            tick();

            result.message.should.equal('Identity card does not exist');
        })));
    });

    describe('#setCurrentIdentityCard', () => {
        let mockFileWallet;
        let mockIdCard1;
        let mockIdCard2;
        let mockCardMap;

        beforeEach(() => {
            mockFileWallet = sinon.createStubInstance(FileWallet);
            mockFileWallet.contains.returns(Promise.resolve(false));
            mockFileWallet.add.returns(Promise.resolve());
            mockFileWallet.update.returns(Promise.resolve());
            mockWalletService.getWallet.returns(mockFileWallet);

            mockConnectionProfileService.createProfile.returns(Promise.resolve());

            mockIdCard1 = sinon.createStubInstance(IdCard);
            mockIdCard1.getEnrollmentCredentials.returns({ id: 'admin'});
            mockIdCard1.getConnectionProfile.returns({name: '$default'});

            mockIdCard2 = sinon.createStubInstance(IdCard);
            mockIdCard2.getEnrollmentCredentials.returns({ id: 'admin'});
            mockIdCard2.getConnectionProfile.returns({name: '$default'});

            mockCardMap = new Map<string, IdCard>();
            mockCardMap.set('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard1);
            mockCardMap.set('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', mockIdCard2);
        });

        it('should set the current identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            service['idCards'] = mockCardMap;

            service.setCurrentIdentityCard('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

            tick();

            mockConnectionProfileService.createProfile.should.not.have.been.called;
            mockWalletService.getWallet.should.not.have.been.called;
            mockIdentityCardStorageService.set.should.have.been.calledWith('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd', { current: true });
            mockConnectionProfileService.setCurrentConnectionProfile.should.have.been.calledWith('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-$default');
            mockIdentityService.setCurrentIdentity.should.have.been.calledWith('admin');
        })));

        it('should change the current identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            mockIdentityCardStorageService.get.withArgs('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd').returns({
                current: true
            });
            service['idCards'] = mockCardMap;
            service['currentCard'] = 'uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

            service.setCurrentIdentityCard('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

            tick();

            mockConnectionProfileService.createProfile.should.not.have.been.called;
            mockWalletService.getWallet.should.not.have.been.called;
            mockIdentityCardStorageService.set.should.have.been.calledTwice;
            mockIdentityCardStorageService.set.should.have.been.calledWith('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd', {});
            mockIdentityCardStorageService.set.should.have.been.calledWith('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd', { current: true });
            mockConnectionProfileService.setCurrentConnectionProfile.should.have.been.calledWith('uuid2xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-$default');
            mockIdentityService.setCurrentIdentity.should.have.been.calledWith('admin');
        })));

        it('should set and activate an unused current identity card', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            mockIdentityCardStorageService.get.withArgs('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd').returns({
                unused: true
            });
            service['idCards'] = mockCardMap;

            service.setCurrentIdentityCard('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

            tick();

            mockConnectionProfileService.createProfile.should.have.been.calledWith('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-$default');
            mockWalletService.getWallet.should.have.been.calledWith('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-$default');
            mockIdentityCardStorageService.set.should.have.been.calledWith('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd', { current: true });
            mockConnectionProfileService.setCurrentConnectionProfile.should.have.been.calledWith('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-$default');
            mockIdentityService.setCurrentIdentity.should.have.been.calledWith('admin');
        })));

        it('should set and activate an unused current identity card (updating a connection profile)', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            mockFileWallet.contains.returns(Promise.resolve(true));
            mockIdentityCardStorageService.get.withArgs('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd').returns({
                unused: true
            });
            service['idCards'] = mockCardMap;

            service.setCurrentIdentityCard('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

            tick();

            mockConnectionProfileService.createProfile.should.have.been.calledWith('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-$default');
            mockWalletService.getWallet.should.have.been.calledWith('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-$default');
            mockIdentityCardStorageService.set.should.have.been.calledWith('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-pd', { current: true });
            mockConnectionProfileService.setCurrentConnectionProfile.should.have.been.calledWith('uuid1xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-$default');
            mockIdentityService.setCurrentIdentity.should.have.been.calledWith('admin');
        })));

        it('should not set the current identity card to one that does not exist', fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {

            let result;
            service.setCurrentIdentityCard('uuid0xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').then((currentCard) => {
                throw Error('Current identity card set without error');
            }, (reason) => {
                result = reason;
            });

            tick();

            result.message.should.equal('Identity card does not exist');
        })));
    });
});
