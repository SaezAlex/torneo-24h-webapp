import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoNoticias } from './info-noticias';

describe('InfoNoticias', () => {
  let component: InfoNoticias;
  let fixture: ComponentFixture<InfoNoticias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoNoticias]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoNoticias);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
